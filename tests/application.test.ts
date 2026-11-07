import test from 'node:test'
import assert from 'node:assert/strict'
import { requestJson, readApiError } from '../src/shared/api/request.ts'
import { getHomeData } from '../src/features/music/api.ts'
import { getCurrentUser, login, AuthError } from '../src/features/auth/api.ts'
import { signup, SignupError } from '../src/features/signup/api.ts'
import { createStore } from '../src/app/store.ts'
import { getArtistName, getTrackCover } from '../src/features/music/presentation.ts'

function respond(body: unknown, status = 200): typeof fetch {
    return async () => new Response(status === 204 ? null : JSON.stringify(body), { status })
}

test('request preserves Headers, session credentials and explicit abort signal', async () => {
    const controller = new AbortController()
    const request: typeof fetch = async (url, options) => {
        assert.match(String(url), /\/api\/v1\/example$/)
        assert.equal(options?.credentials, 'include')
        assert.equal(options?.signal, controller.signal)
        const headers = new Headers(options?.headers)
        assert.equal(headers.get('x-test'), 'yes')
        assert.equal(headers.get('content-type'), 'application/custom')
        return new Response(null, { status: 204 })
    }
    const { body } = await requestJson(
        '/example',
        {
            headers: new Headers({ 'x-test': 'yes', 'content-type': 'application/custom' }),
            signal: controller.signal,
        },
        request,
    )
    assert.equal(body, null)
})

test('untrusted API errors only expose string field messages', () => {
    assert.deepEqual(readApiError({ error: { code: 17, fields: { email: 'Invalid', password: {} } } }), {
        code: '',
        message: '',
        fields: { email: 'Invalid' },
    })
    assert.deepEqual(readApiError(null), { code: '', message: '', fields: {} })
})

test('catalog accepts supported artist and duration variants', async () => {
    const catalog = {
        tracks: [{ id: 1, artists: ['A', { name: 'B' }], duration: { seconds: 125 } }],
        artists: [],
        albums: [],
    }
    assert.deepEqual(await getHomeData(respond(catalog)), catalog)
    assert.equal(getArtistName(catalog.tracks[0]), 'A, B')
    assert.equal(getTrackCover({ id: 1, album: { cover_url: '/cover.png' } }), '/cover.png')
})

test('catalog rejects malformed entries before components render them', async () => {
    for (const body of [
        null,
        { tracks: [], artists: {} },
        { tracks: [null], artists: [], albums: [] },
        { tracks: [{ id: 1, title: {} }], artists: [], albums: [] },
        { tracks: [{ id: 1, artists: [42] }], artists: [], albums: [] },
    ]) {
        await assert.rejects(getHomeData(respond(body)), /неизвестном формате/)
    }
})

test('session distinguishes signed-out, valid and malformed users', async () => {
    assert.equal(await getCurrentUser(respond({}, 401)), null)
    assert.deepEqual(await getCurrentUser(respond({ email: 'a@example.test', id: 1 })), {
        email: 'a@example.test',
        id: 1,
        display_name: undefined,
    })
    await assert.rejects(getCurrentUser(respond({ email: {} })), AuthError)
    const user = await getCurrentUser(respond({ id: 1, display_name: 'User', avatar_url: '/avatar.png' }))
    assert.equal(user?.avatar_url, '/avatar.png')
})

test('login and signup retain validation messages and success statuses', async () => {
    await assert.rejects(
        login(
            { email: 'a', password: 'b' },
            respond(
                {
                    error: { code: 'validation_failed', fields: { email: 'Invalid email' } },
                },
                400,
            ),
        ),
        (error: unknown) => error instanceof AuthError && error.fields.email === 'Invalid email',
    )
    const data = { display_name: 'User', email: 'a@example.test', password: 'password1' }
    await signup(data, respond({}, 201))
    await assert.rejects(signup(data, respond({ error: { code: 'email_taken' } }, 409)), SignupError)
})

test('store merges partial updates, skips unchanged values, and unsubscribes', () => {
    const store = createStore({ count: 0, label: 'counter' })
    const observed: number[] = []
    const unsubscribe = store.subscribe(state => observed.push(state.count))
    store.setState(previous => ({ count: previous.count + 1 }))
    store.setState({ count: 1 })
    assert.deepEqual(store.getState(), { count: 1, label: 'counter' })
    assert.deepEqual(observed, [1])
    unsubscribe()
    store.setState({ count: 2 })
    assert.deepEqual(observed, [1])
})
