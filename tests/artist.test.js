import assert from 'node:assert/strict'
import { artistDemo } from './fixtures/artist.js'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { Window } from 'happy-dom'

let vite
let mountApp
let createAppRouter
let render
let createElement
let ArtistPage
let AppLayout

before(async () => {
    vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
    ;({ mountApp } = await vite.ssrLoadModule('/src/app/App.jsx'))
    ;({ createAppRouter } = await vite.ssrLoadModule('/src/app/router.js'))
    ;({ render, createElement } = await vite.ssrLoadModule('/src/shared/lib/my-react/index.js'))
    ;({ ArtistPage } = await vite.ssrLoadModule('/src/pages/ArtistPage.tsx'))
    ;({ AppLayout } = await vite.ssrLoadModule('/src/components/layout/AppLayout.jsx'))
})

after(async () => {
    await vite?.close()
})

async function open(t, path = '/artists/big-baby-tape', fetchCatalog) {
    const artists = [{ id: artistDemo.id, name: artistDemo.name, image_url: artistDemo.image_url }]
    const catalog = {
        artists,
        tracks: artistDemo.tracks.map(track => ({ ...track, duration_ms: track.duration * 1000, artists })),
        albums: artistDemo.albums.map(album => ({ ...album, artists })),
    }
    t.mock.method(globalThis, 'fetch', async url => {
        if (String(url).endsWith('/auth/me')) return Response.json({ display_name: 'Пользователь' })
        assert.ok(String(url).endsWith('/home'))
        return fetchCatalog ? fetchCatalog(catalog) : Response.json(catalog)
    })
    const win = new Window({ url: `http://localhost${path}` })
    const names = ['window', 'document', 'CustomEvent']
    const previous = names.map(name => globalThis[name])
    for (const name of names) globalThis[name] = name === 'window' ? win : win[name]
    const root = win.document.createElement('div')
    win.document.body.appendChild(root)
    const router = createAppRouter()
    const dispose = mountApp(root, router)

    t.after(async () => {
        dispose()
        render(null, root)
        await win.happyDOM.close()
        names.forEach((name, index) => {
            if (previous[index] === undefined) delete globalThis[name]
            else globalThis[name] = previous[index]
        })
    })

    await new Promise(resolve => setTimeout(resolve, 0))
    return { root, win }
}

test('прямая ссылка загружает исполнителя и изображения из API', async t => {
    const { root } = await open(t)
    assert.equal(root.querySelector('h1').textContent, 'Big Baby Tape')
    assert.equal(root.querySelector('.artist-page__listeners'), null)
    assert.equal(root.querySelector('.artist-page__photo img').getAttribute('src'), artistDemo.image_url)
    assert.equal(
        root.querySelector('.artist-tracks img[src="/media/znak.jpg"]')?.getAttribute('src'),
        '/media/znak.jpg',
    )
    assert.equal(root.querySelectorAll('.artist-tracks__item').length, 5)
    assert.equal(root.querySelectorAll('.artist-albums__card').length, 3)
    assert.ok(root.querySelector('.app-shell .sidebar'))
    assert.equal(root.querySelector('.player__track-copy strong').textContent, 'ЗНАК')
})

test('выбор трека обновляет плеер, а Слушать возвращает первый трек', async t => {
    const { root } = await open(t)
    root.querySelectorAll('.artist-tracks__select')[1].click()
    assert.equal(root.querySelector('.player__track-copy strong').textContent, 'ЭКСПОНАТ')
    assert.equal(root.querySelectorAll('.artist-tracks__select')[1].getAttribute('aria-current'), 'true')
    root.querySelector('.artist-page__listen').click()
    assert.equal(root.querySelector('.player__track-copy strong').textContent, 'ЗНАК')
})

test('главная и исполнитель используют один сайдбар при смене страницы', async t => {
    const { root } = await open(t)
    const props = {
        user: { display_name: 'Пользователь' },
        tracks: [],
    }
    render(createElement(AppLayout, { ...props, route: 'home' }), root)
    const sidebar = root.querySelector('.sidebar')
    const images = [...sidebar.querySelectorAll('img')].map(image => image.getAttribute('src'))
    render(createElement(AppLayout, { ...props, route: 'artist' }), root)
    assert.equal(root.querySelector('.sidebar'), sidebar)
    assert.deepEqual(
        [...sidebar.querySelectorAll('img')].map(image => image.getAttribute('src')),
        images,
    )
    assert.equal(sidebar.querySelector('.sidebar__account button'), null)
    assert.equal(sidebar.querySelector('.sidebar__account-copy strong').textContent, 'Пользователь')
})

test('избранное переключается и не сбрасывается при выборе другого трека', async t => {
    const { root } = await open(t)
    const like = root.querySelector('.artist-tracks__like')
    assert.equal(like.getAttribute('aria-pressed'), 'true')
    like.click()
    assert.equal(like.getAttribute('aria-pressed'), 'false')
    root.querySelectorAll('.artist-tracks__select')[1].click()
    assert.equal(root.querySelector('.artist-tracks__like').getAttribute('aria-pressed'), 'false')
})

test('Смотреть все раскрывает треки и альбомы независимо и позволяет свернуть', async t => {
    const { root } = await open(t)
    root.querySelector('.artist-page__tracks .artist-page__more').click()
    assert.equal(root.querySelectorAll('.artist-tracks__item').length, artistDemo.tracks.length)
    assert.equal(root.querySelectorAll('.artist-albums__card').length, 3)
    root.querySelector('.artist-page__albums .artist-page__more').click()
    assert.equal(root.querySelectorAll('.artist-albums__card').length, artistDemo.albums.length)
    root.querySelector('.artist-page__tracks .artist-page__more').click()
    assert.equal(root.querySelectorAll('.artist-tracks__item').length, 5)
})

test('меню трека выбирает трек и закрывается', async t => {
    const { root } = await open(t)
    root.querySelectorAll('.artist-tracks__more')[1].click()
    assert.ok(root.querySelector('.artist-tracks__menu'))
    root.querySelector('.artist-tracks__menu button').click()
    assert.equal(root.querySelector('.player__track-copy strong').textContent, 'ЭКСПОНАТ')
    assert.equal(root.querySelector('.artist-tracks__menu'), null)
})

test('плеер переключает избранное и Не нравится независимо для каждого трека', async t => {
    const { root } = await open(t)
    const like = root.querySelector('.player__like')
    assert.equal(like.getAttribute('aria-pressed'), 'true')
    like.click()
    assert.equal(like.getAttribute('aria-pressed'), 'false')
    const dislike = root.querySelector('.player__dislike')
    dislike.click()
    assert.equal(dislike.getAttribute('aria-pressed'), 'true')
    like.click()
    assert.equal(dislike.getAttribute('aria-pressed'), 'false')
    root.querySelector('[aria-label="Следующий трек"]').click()
    assert.equal(root.querySelector('.player__like').getAttribute('aria-pressed'), 'false')
    root.querySelector('[aria-label="Предыдущий трек"]').click()
    assert.equal(root.querySelector('.player__like').getAttribute('aria-pressed'), 'true')
})

test('плеер переключает воспроизведение, соседние треки, прогресс и звук', async t => {
    const { root, win } = await open(t)
    assert.equal(root.querySelector('.player__control--play').getAttribute('aria-label'), 'Пауза')
    root.querySelector('.player__control--play').click()
    assert.equal(root.querySelector('.player__control--play').getAttribute('aria-label'), 'Воспроизвести')
    root.querySelector('.player__control--play').click()
    assert.equal(root.querySelector('.player__control--play').getAttribute('aria-label'), 'Пауза')
    root.querySelector('[aria-label="Следующий трек"]').click()
    assert.equal(root.querySelector('.player__track-copy strong').textContent, 'ЭКСПОНАТ')
    root.querySelector('[aria-label="Предыдущий трек"]').click()
    assert.equal(root.querySelector('.player__track-copy strong').textContent, 'ЗНАК')
    const progress = root.querySelector('.player__timeline input')
    progress.value = '59'
    progress.dispatchEvent(new win.Event('input'))
    assert.match(progress.style.background, /59%/)
    assert.equal(root.querySelector('[aria-label="Прошло времени"]').textContent, '2:07')
    root.querySelector('[aria-label="Следующий трек"]').click()
    assert.equal(root.querySelector('[aria-label="Прошло времени"]').textContent, '0:00')
    const volume = root.querySelector('.player__volume')
    volume.value = '28'
    volume.dispatchEvent(new win.Event('input'))
    assert.equal(volume.value, '28')
    root.querySelector('.player__mute').click()
    assert.equal(volume.value, '0')
    root.querySelector('.player__mute').click()
    assert.ok(Number(volume.value) > 0)
})

test('очередь закрывается по клику вне окна и выбору трека', async t => {
    const { root } = await open(t)
    assert.equal(root.querySelector('.player__lyrics-button'), null)
    root.querySelector('.player__queue-button').click()
    root.querySelector('.artist-page__hero h1').click()
    assert.equal(root.querySelector('.player__queue-panel'), null)
    root.querySelector('.player__queue-button').click()
    assert.equal(root.querySelectorAll('.player__queue-panel li').length, artistDemo.tracks.length)
    root.querySelectorAll('.player__queue-panel li button')[1].click()
    assert.equal(root.querySelector('.player__track-copy strong').textContent, 'ЭКСПОНАТ')
    assert.equal(root.querySelector('.player__queue-panel'), null)
})

test('неизвестный исполнитель показывает отдельное состояние', async t => {
    const { root } = await open(t, '/artists/unknown')
    assert.equal(root.querySelector('h1').textContent, 'Исполнитель не найден')
    assert.equal(root.querySelector('.artist-page--empty a').getAttribute('href'), '/')
})

test('пустые разделы и повреждённая фотография имеют запасное представление', async t => {
    const { root, win } = await open(t)
    render(
        createElement(ArtistPage, {
            artist: { ...artistDemo, tracks: [], albums: [] },
            artistId: artistDemo.id,
            onTrackSelect: () => {},
        }),
        root,
    )
    assert.equal(root.querySelector('.artist-page__listen').disabled, true)
    assert.equal(root.querySelectorAll('.artist-tracks__empty, .artist-albums__empty').length, 2)
    root.querySelector('.artist-page__photo img').dispatchEvent(new win.Event('error'))
    assert.equal(root.querySelector('.artist-page__photo img'), null)
    assert.ok(root.querySelector('.artist-page__photo svg'))
})

test('ошибка API не подменяется демонстрационными данными, повторная загрузка работает', async t => {
    let attempts = 0
    const { root } = await open(t, '/artists/big-baby-tape', catalog => {
        attempts++
        return attempts === 1 ? Response.json({}, { status: 500 }) : Response.json(catalog)
    })
    assert.ok(root.querySelector('.artist-page [role="alert"]'))
    assert.equal(root.querySelector('.artist-page__photo'), null)
    root.querySelector('.artist-page button').click()
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(root.querySelector('h1').textContent, artistDemo.name)
})

test('null URL из БД показываются без подставных изображений', async t => {
    const { root } = await open(t, '/artists/big-baby-tape', catalog =>
        Response.json({
            artists: catalog.artists.map(artist => ({ ...artist, image_url: null })),
            tracks: catalog.tracks.map(track => ({ ...track, cover_url: null })),
            albums: catalog.albums.map(album => ({ ...album, cover_url: null })),
        }),
    )
    assert.equal(root.querySelector('.artist-page__photo img'), null)
    assert.equal(root.querySelector('.artist-tracks .artist-cover img'), null)
    assert.equal(root.querySelector('.artist-albums .artist-cover img'), null)
    assert.ok(root.querySelector('.artist-page__photo svg'))
})
