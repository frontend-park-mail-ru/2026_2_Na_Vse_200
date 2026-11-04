import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateProfile } from '../src/features/profile/validation.ts'
import { ProfileError, updateProfile } from '../src/features/profile/api.ts'
import { getCurrentUser } from '../src/features/auth/api.js'
import { requestJson } from '../src/shared/api/request.js'

const user = { id: 'user-id', display_name: 'Андрей', email: 'andrey@example.com', avatar_url: null }

test('имя обрезается по краям, длина считается в символах Unicode', () => {
    assert.deepEqual(validateProfile('  Андрей  '), { name: 'Андрей', errors: {} })
    assert.deepEqual(validateProfile('🎧🎵').errors, {})
    assert.deepEqual(validateProfile('я'.repeat(50)).errors, {})
    for (const name of ['', '  ', 'А', 'я'.repeat(51), '🎧']) {
        assert.ok(validateProfile(name).errors.display_name)
    }
})

test('аватар необязателен, принимаются только непустые JPEG и PNG', () => {
    assert.deepEqual(validateProfile('Андрей').errors, {})
    for (const type of ['image/jpeg', 'image/png']) {
        assert.deepEqual(validateProfile('Андрей', new File(['image'], 'avatar', { type })).errors, {})
    }
    assert.ok(validateProfile('Андрей', new File(['gif'], 'avatar.gif', { type: 'image/gif' })).errors.avatar)
    assert.ok(validateProfile('Андрей', new File([], 'avatar.png', { type: 'image/png' })).errors.avatar)
})

test('профиль отправляется одной multipart-формой с cookie, без JSON-заголовка', async t => {
    const photo = new File(['image'], 'avatar.png', { type: 'image/png' })
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        assert.equal(url, '/api/v1/users/me')
        assert.equal(options.method, 'PATCH')
        assert.equal(options.credentials, 'include')
        assert.ok(options.body instanceof FormData)
        assert.equal(options.body.get('display_name'), 'Андрей')
        assert.equal(options.body.get('avatar'), photo)
        assert.equal(new Headers(options.headers).has('Content-Type'), false)
        return Response.json(user)
    })
    assert.deepEqual(await updateProfile('Андрей', photo), user)
})

test('без новой фотографии поле avatar не отправляется', async t => {
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
        assert.equal(options.body.has('avatar'), false)
        return Response.json(user)
    })
    await updateProfile('Андрей')
})

test('обычные JSON-запросы сохраняют заголовок и передачу cookie', async t => {
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
        assert.equal(new Headers(options.headers).get('Content-Type'), 'application/json')
        assert.equal(options.credentials, 'include')
        assert.equal(options.body, '{"email":"andrey@example.com"}')
        return Response.json(user)
    })
    await requestJson('/auth/login', { method: 'POST', body: '{"email":"andrey@example.com"}' })
})

test('ошибки полей, истёкшая сессия и большой файл различаются', async t => {
    const cases = [
        {
            status: 400,
            body: { error: { code: 'validation_failed', fields: { display_name: 'Неверное имя' } } },
            fields: { display_name: 'Неверное имя' },
        },
        { status: 401, body: {}, code: 'unauthorized' },
        { status: 413, body: {}, field: 'avatar' },
    ]
    for (const item of cases) {
        await t.test(String(item.status), async t => {
            t.mock.method(globalThis, 'fetch', async () => Response.json(item.body, { status: item.status }))
            await assert.rejects(updateProfile('Андрей'), error => {
                assert.ok(error instanceof ProfileError)
                if (item.fields) assert.deepEqual(error.fields, item.fields)
                if (item.code) assert.equal(error.code, item.code)
                if (item.field) assert.ok(error.fields[item.field])
                return true
            })
        })
    }
})

test('невалидный успешный ответ не считается сохранённым профилем', async t => {
    t.mock.method(globalThis, 'fetch', async () => Response.json({}))
    await assert.rejects(updateProfile('Андрей'), ProfileError)
})

test('сбой сети при проверке сессии не превращается в гостевой вход', async t => {
    t.mock.method(globalThis, 'fetch', async () => {
        throw new TypeError('Failed to fetch')
    })
    await assert.rejects(getCurrentUser(), { code: 'network_error' })
    await assert.rejects(updateProfile('Андрей'), ProfileError)
})

test('401 при чтении сессии означает отсутствие пользователя', async t => {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ error: { code: 'unauthorized' } }, { status: 401 }))
    assert.equal(await getCurrentUser(), null)
})
