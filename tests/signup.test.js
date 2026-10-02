import test from 'node:test'
import assert from 'node:assert/strict'
import { validateSignup } from '../src/features/signup/validation.js'
import { signup, SignupError } from '../src/features/signup/api.js'

const valid = { display_name: ' Анна ', email: ' ANNA@Example.com ', password: ' password1 ' }

test('signup normalizes name/email, preserves password and reports all invalid fields', () => {
    const { data, errors } = validateSignup(valid)
    assert.deepEqual(data, { display_name: 'Анна', email: 'anna@example.com', password: valid.password })
    assert.deepEqual(errors, {})
    assert.deepEqual(Object.keys(validateSignup({ display_name: ' ', email: 'a@@b', password: '123' }).errors), [
        'display_name',
        'email',
        'password',
    ])
})

test('signup enforces field boundaries and supports Cyrillic passwords', () => {
    for (const length of [2, 50])
        assert.equal(validateSignup({ ...valid, display_name: 'я'.repeat(length) }).errors.display_name, undefined)
    for (const length of [1, 51])
        assert.ok(validateSignup({ ...valid, display_name: 'я'.repeat(length) }).errors.display_name)
    for (const password of ['пароль12', 'a'.repeat(71) + '1'])
        assert.equal(validateSignup({ ...valid, password }).errors.password, undefined)
    for (const password of ['short1', 'abcdefgh', '12345678', 'a'.repeat(72) + '1'])
        assert.ok(validateSignup({ ...valid, password }).errors.password)
    for (const email of ['a@b', '@host.com', 'name@', 'a b@host.com', 'a@@host.com', 'a'.repeat(250) + '@b.com'])
        assert.ok(validateSignup({ ...valid, email }).errors.email)
})

test('signup sends JSON with cookies and accepts 201 without auto-login', async () => {
    const { data } = validateSignup(valid)
    await signup(data, async (url, options) => {
        assert.ok(url.endsWith('/api/v1/auth/signup'))
        assert.equal(options.method, 'POST')
        assert.equal(options.credentials, 'include')
        assert.equal(options.headers['Content-Type'], 'application/json')
        assert.deepEqual(JSON.parse(options.body), data)
        assert.ok(options.signal instanceof AbortSignal)
        return new Response('{}', { status: 201 })
    })
})

test('duplicate email and server validation map to field errors', async () => {
    await assert.rejects(
        signup(valid, async () => Response.json({ error: { code: 'email_taken' } }, { status: 409 })),
        error => error instanceof SignupError && Boolean(error.fields.email),
    )
    await assert.rejects(
        signup(valid, async () =>
            Response.json(
                {
                    error: {
                        code: 'validation_failed',
                        fields: { display_name: 'Имя занято', password: 'Слишком короткий', unknown: 'ignore' },
                    },
                },
                { status: 400 },
            ),
        ),
        error => {
            assert.deepEqual(error.fields, { display_name: 'Имя занято', password: 'Слишком короткий' })
            return true
        },
    )
})

test('network, invalid responses and server failures produce retryable user errors', async () => {
    for (const status of [200, 400, 500, 502]) {
        await assert.rejects(
            signup(valid, async () => new Response('<html>error</html>', { status })),
            error => error instanceof SignupError && Boolean(error.message),
        )
    }
    await assert.rejects(
        signup(valid, async () => {
            throw new TypeError('Failed to fetch')
        }),
        error => error instanceof SignupError && error.message.includes('соединение'),
    )
})
