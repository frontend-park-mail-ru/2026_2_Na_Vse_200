import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { Window } from 'happy-dom'

let vite
let mountApp
let createAppRouter
let appStore

before(async () => {
    vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
    ;({ mountApp } = await vite.ssrLoadModule('/src/app/App.jsx'))
    ;({ createAppRouter } = await vite.ssrLoadModule('/src/app/router.js'))
    ;({ appStore } = await vite.ssrLoadModule('/src/app/store.js'))
})

after(async () => {
    await vite?.close()
})

const settle = () => new Promise(resolve => setImmediate(resolve))

async function open(t, path = '/profile') {
    const win = new Window({ url: `http://localhost${path}` })
    const globals = ['window', 'document', 'CustomEvent', 'FileReader', 'File', 'FormData']
    const previous = globals.map(name => globalThis[name])
    for (const name of globals) globalThis[name] = name === 'window' ? win : win[name]
    win.document.body.innerHTML = '<div id="root"></div>'

    const api = {
        user: { id: 'user-id', display_name: 'Андрей', email: 'andrey@example.com', avatar_url: null },
        session: 200,
        save: 200,
        calls: [],
    }
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        api.calls.push({ url, options })
        if (url.endsWith('/auth/me')) return Response.json(api.session === 200 ? api.user : {}, { status: api.session })
        if (url.endsWith('/users/me')) {
            if (api.save !== 200) return Response.json({ error: { code: 'internal_error', message: 'Ошибка сохранения' } }, { status: api.save })
            api.user = { ...api.user, display_name: options.body.get('display_name') }
            if (options.body.has('avatar')) api.user.avatar_url = 'https://music.example/avatar.png'
            return Response.json(api.user)
        }
        if (url.endsWith('/home')) {
            return Response.json({ tracks: [{ id: 'track-id', title: 'Тестовый трек' }], artists: [], albums: [] })
        }
        if (url.endsWith('/auth/login')) return Response.json(api.user)
        return new Response(null, { status: 204 })
    })

    appStore.setState({ tracks: [], artists: [], albums: [] })
    const router = createAppRouter()
    const dispose = mountApp(win.document.getElementById('root'), router)
    t.after(async () => {
        dispose()
        await win.happyDOM.close()
        globals.forEach((name, i) => {
            if (previous[i] === undefined) delete globalThis[name]
            else globalThis[name] = previous[i]
        })
    })
    await settle()
    return { win, router, api, root: win.document.getElementById('root') }
}

function edit(root) {
    root.querySelector('.profile-page__hero button').click()
    const dialog = root.querySelector('dialog')
    assert.equal(dialog.open, true)
    return dialog
}

function submit(win, form) {
    form.dispatchEvent(new win.SubmitEvent('submit', { bubbles: true, cancelable: true }))
}

test('прямая ссылка на профиль восстанавливает пользователя', async t => {
    const { root, win, api } = await open(t)
    assert.equal(root.querySelector('h1').textContent, 'Профиль')
    assert.equal(root.querySelector('.profile-page__name').textContent, 'Андрей')
    assert.equal(root.querySelector('dd').textContent, 'andrey@example.com')
    assert.equal(win.document.title, 'Профиль — На все 200')
    assert.equal(api.calls.filter(call => call.url.endsWith('/auth/me')).length, 1)
})

test('отмена отбрасывает имя и не отправляет запрос', async t => {
    const { root, api } = await open(t)
    let dialog = edit(root)
    dialog.querySelector('[name="display_name"]').value = 'Другое имя'
    dialog.querySelector('.profile-button--cancel').click()
    assert.equal(root.querySelector('dialog'), null)
    dialog = edit(root)
    assert.equal(dialog.querySelector('[name="display_name"]').value, 'Андрей')
    assert.equal(api.calls.filter(call => call.options.method === 'PATCH').length, 0)
})

test('неверное имя остаётся в форме с ошибкой', async t => {
    const { root, win, api } = await open(t)
    const dialog = edit(root)
    const field = dialog.querySelector('[name="display_name"]')
    field.value = 'А'
    submit(win, dialog.querySelector('form'))
    assert.equal(field.value, 'А')
    assert.equal(field.getAttribute('aria-invalid'), 'true')
    assert.match(dialog.querySelector('#profile-name-error').textContent, /от 2 до 50/)
    assert.equal(api.calls.filter(call => call.options.method === 'PATCH').length, 0)
})

test('сохранение обновляет профиль и боковую панель', async t => {
    const { root, win, api } = await open(t)
    const dialog = edit(root)
    dialog.querySelector('[name="display_name"]').value = '  Новое имя  '
    submit(win, dialog.querySelector('form'))
    await settle()
    assert.equal(root.querySelector('dialog'), null)
    assert.equal(root.querySelector('.profile-page__name').textContent, 'Новое имя')
    assert.equal(root.querySelector('.sidebar__account-copy strong').textContent, 'Новое имя')
    assert.equal(api.user.display_name, 'Новое имя')
})

test('ошибка сервера сохраняет черновик и позволяет повторить запрос', async t => {
    const { root, win, api } = await open(t)
    api.save = 500
    const dialog = edit(root)
    const field = dialog.querySelector('[name="display_name"]')
    field.value = 'Новое имя'
    submit(win, dialog.querySelector('form'))
    await settle()
    assert.equal(dialog.open, true)
    assert.equal(field.value, 'Новое имя')
    assert.equal(dialog.querySelector('[type="submit"]').disabled, false)
    assert.equal(root.querySelector('.profile-page__name').textContent, 'Андрей')
    api.save = 200
    submit(win, dialog.querySelector('form'))
    await settle()
    assert.equal(root.querySelector('.profile-page__name').textContent, 'Новое имя')
})

test('фото показывается до сохранения и передаётся вместе с именем', async t => {
    const { root, win, api } = await open(t)
    const dialog = edit(root)
    const input = dialog.querySelector('[name="avatar"]')
    input.files = [new win.File(['image'], 'avatar.png', { type: 'image/png' })]
    input.dispatchEvent(new win.Event('change'))
    await win.happyDOM.waitUntilComplete()
    assert.match(dialog.querySelector('.user-avatar img').src, /^data:image\/png;base64,/)
    submit(win, dialog.querySelector('form'))
    await settle()
    const call = api.calls.find(call => call.options.method === 'PATCH')
    assert.equal(call.options.body.get('avatar').name, 'avatar.png')
    assert.equal(root.querySelector('.profile-page__avatar img').src, 'https://music.example/avatar.png')
    assert.equal(root.querySelector('.sidebar__avatar img').src, 'https://music.example/avatar.png')
})

test('истёкшая сессия при сохранении переводит на вход', async t => {
    const { root, win, api } = await open(t)
    api.save = 401
    const dialog = edit(root)
    submit(win, dialog.querySelector('form'))
    await settle()
    assert.equal(win.location.pathname, '/login')
    assert.equal(win.location.search, '?next=/profile')
    assert.match(root.querySelector('.auth-page__notice').textContent, /Сессия истекла/)
})

test('переход между главной и профилем сохраняет плеер', async t => {
    const { root, router } = await open(t, '/')
    const player = root.querySelector('.player')
    root.querySelector('[aria-label="Воспроизвести"]').click()
    router.navigate('/profile')
    await settle()
    assert.equal(root.querySelector('.player'), player)
    assert.ok(root.querySelector('[aria-label="Пауза"]'))
    router.navigate('/')
    await settle()
    assert.equal(root.querySelector('.player'), player)
    assert.ok(root.querySelector('[aria-label="Пауза"]'))
})
