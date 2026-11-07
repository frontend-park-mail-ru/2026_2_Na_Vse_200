import { artistFeature } from '../features/artist/feature.ts'
import { createElement, render } from '@navse200/my-react'
import { appStore } from './store.js'
import { getCurrentUser, logout } from '../features/auth/api.js'
import { getHomeData } from '../features/music/api.js'
import { createPlayer, getAudioUrl } from '../shared/audio/player.ts'
import {
    connectionAvailable,
    isNetworkError,
    observeConnection,
    subscribeConnection,
} from '../shared/offline/network.ts'
import { getCacheScope, getSavedUser, rememberUser, restoreUserScope } from '../shared/offline/storage.ts'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { HomePage } from '../pages/HomePage.jsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { SignupPage } from '../pages/SignupPage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'

const pages = {
    home: { component: HomePage, title: 'Главная' },
    login: { component: LoginPage, title: 'Вход' },
    signup: { component: SignupPage, title: 'Регистрация' },
    [artistFeature.name]: { component: artistFeature.Page, title: artistFeature.title },
    'not-found': { component: NotFoundPage, title: 'Страница не найдена' },
}

/** Mount-scoped requests and subscriptions: no session or audio state is shared between mounts. */
export function mountApp(container, router) {
    appStore.setState({ tracks: [], artists: [], albums: [] })
    const stopObserving = observeConnection()
    const player = createPlayer()
    const artistController = artistFeature.createController()
    let disposed = false
    let generation = 0
    let sessionChecked = false
    let sessionRequest = null
    let catalogRequest = null
    let currentTracks = []
    const state = {
        user: null,
        sessionStatus: 'loading',
        sessionError: '',
        authAction: false,
        tracksStatus: 'idle',
        tracksError: '',
        offline: false,
        notice: '',
        activeTrackId: undefined,
    }
    const route = () => router.findRoute(router.getCurrentUrl().pathname)
    const dataRoute = () => ['home', 'artist'].includes(route()?.value)
    const selectTrack = track => {
        state.activeTrackId = track.id
        renderCurrent()
        void player.play()
    }

    function renderCurrent() {
        if (disposed) return
        const match = route()
        const routeName = match?.value ?? 'not-found'
        const { component: Page, title } = pages[routeName] ?? pages['not-found']
        const catalog = appStore.getState()
        const artistState = artistController.getState()
        const artist = artistState.id === match?.params.id ? artistState.artist : undefined
        currentTracks = routeName === 'artist' ? (artist?.tracks ?? []) : catalog.tracks
        const activeTrack = currentTracks.find(track => track.id === state.activeTrackId) ?? currentTracks[0]
        if (activeTrack) state.activeTrackId = activeTrack.id
        player.setTrack(dataRoute() ? activeTrack : undefined)
        const offline = state.offline || !connectionAvailable()
        const authRoute = routeName === 'login' || routeName === 'signup'
        document.title = `${title} — На все 200`
        const page = (
            <Page
                {...catalog}
                artist={artist}
                artistId={match?.params.id}
                tracksStatus={routeName === 'artist' ? artistState.status : state.tracksStatus}
                tracksError={routeName === 'artist' ? artistState.error : state.tracksError}
                onTracksRetry={() => void refresh(true)}
                activeTrack={activeTrack}
                onTrackSelect={selectTrack}
                onRegistered={() => {
                    state.notice = 'Аккаунт создан. Войдите, используя свою почту и пароль.'
                    router.navigate('/login')
                }}
                onAuthenticated={onAuthenticated}
                notice={state.notice}
                offline={offline}
            />
        )
        render(
            <div className="application">
                {offline ? (
                    <div className="offline-banner" role="status">
                        Нет соединения. Доступны сохранённые экраны; вход и изменения требуют интернета.
                        <button type="button" onClick={() => void refresh(true)}>
                            Проверить соединение
                        </button>
                    </div>
                ) : null}
                {dataRoute() && state.sessionStatus === 'loading' ? (
                    <main className="session-loading" aria-live="polite">
                        Проверяем сессию…
                    </main>
                ) : dataRoute() && state.sessionStatus === 'error' ? (
                    <main className="session-loading" role="alert">
                        <p>{state.sessionError}</p>
                        <button type="button" onClick={() => void refresh(true)}>
                            Попробовать ещё раз
                        </button>
                    </main>
                ) : (
                    <AppLayout
                        player={player}
                        tracks={currentTracks}
                        route={routeName}
                        user={state.user}
                        onLogout={onLogout}
                        onTrackSelect={selectTrack}
                        activeTrack={activeTrack}
                        sessionError={state.sessionError}
                        authAction={state.authAction}
                        offline={offline}
                    >
                        {authRoute ? (
                            <fieldset className="offline-auth" disabled={offline}>
                                {page}
                            </fieldset>
                        ) : (
                            page
                        )}
                    </AppLayout>
                )}
            </div>,
            container,
        )
    }

    async function restoreSession() {
        if (sessionChecked) return
        if (sessionRequest) return sessionRequest
        const version = generation
        const request = (async () => {
            state.sessionStatus = 'loading'
            renderCurrent()
            try {
                const user = await getCurrentUser()
                if (disposed || version !== generation) return
                await rememberUser(user)
                if (disposed || version !== generation) return
                state.user = user
                state.offline = false
                state.sessionStatus = 'ready'
                state.sessionError = ''
                if (!user) appStore.setState({ tracks: [], artists: [], albums: [] })
            } catch (error) {
                if (disposed || version !== generation) return
                if (isNetworkError(error)) {
                    const saved = await getSavedUser()
                    if (disposed || version !== generation) return
                    restoreUserScope(saved)
                    state.user = saved ?? null
                    state.offline = true
                    state.sessionStatus = 'offline'
                    state.sessionError = ''
                } else {
                    state.sessionStatus = 'error'
                    state.sessionError = error.message
                }
            }
            if (!disposed && version === generation) sessionChecked = true
        })()
        sessionRequest = request
        try {
            await request
        } finally {
            if (sessionRequest === request) sessionRequest = null
        }
    }

    async function loadCatalog() {
        if (state.tracksStatus === 'ready') return
        if (catalogRequest) return catalogRequest
        const version = generation
        const scope = getCacheScope()
        const request = (async () => {
            state.tracksStatus = 'loading'
            state.tracksError = ''
            renderCurrent()
            try {
                const catalog = await getHomeData(scope)
                if (disposed || version !== generation) return
                appStore.setState({ tracks: catalog.tracks, artists: catalog.artists, albums: catalog.albums })
                state.offline = catalog.offline
                state.tracksStatus = 'ready'
            } catch (error) {
                if (disposed || version !== generation) return
                state.tracksStatus = 'error'
                state.tracksError = error.message
            }
        })()
        catalogRequest = request
        try {
            await request
        } finally {
            if (catalogRequest === request) catalogRequest = null
        }
    }

    async function loadArtist() {
        const match = route()
        if (match?.value !== 'artist') return
        await artistController.load(match.params.id, getCacheScope())
        if (!disposed && route()?.value === 'artist') state.offline = artistController.getState().offline
    }

    async function refresh(force = false) {
        if (disposed) return
        const version = generation
        if (force) {
            sessionChecked = false
            state.tracksStatus = 'idle'
        }
        if (!dataRoute()) {
            if (force) await restoreSession()
            renderCurrent()
            return
        }
        await restoreSession()
        if (disposed || version !== generation || !dataRoute()) return
        if (state.sessionStatus === 'error') {
            renderCurrent()
            return
        }
        if (!state.user && state.sessionStatus === 'ready' && route()?.value === 'home') {
            router.navigate('/signup', { replace: true })
            return
        }
        if (route()?.value === 'home') await loadCatalog()
        if (disposed || version !== generation) return
        await loadArtist()
        renderCurrent()
    }

    async function onAuthenticated(user) {
        generation++
        const version = generation
        sessionRequest = null
        catalogRequest = null
        state.user = user
        artistController.reset()
        state.activeTrackId = undefined
        state.tracksStatus = 'idle'
        appStore.setState({ tracks: [], artists: [], albums: [] })
        await rememberUser(user)
        if (disposed || version !== generation) return
        sessionChecked = true
        state.sessionStatus = 'ready'
        state.sessionError = ''
        state.offline = false
        router.navigate('/')
    }

    async function onLogout() {
        if (state.authAction) return
        if (!connectionAvailable()) {
            state.sessionError = 'Для выхода подключитесь к интернету.'
            renderCurrent()
            return
        }
        state.authAction = true
        renderCurrent()
        try {
            await logout()
            generation++
            await rememberUser(null)
            state.user = null
            artistController.reset()
            state.activeTrackId = undefined
            state.tracksStatus = 'idle'
            state.sessionError = ''
            sessionChecked = false
            appStore.setState({ tracks: [], artists: [], albums: [] })
            router.navigate('/login')
        } catch (error) {
            state.sessionError = error.message
        } finally {
            state.authAction = false
            renderCurrent()
        }
    }

    player.setOnEnded(() => {
        const playable = currentTracks.filter(track => getAudioUrl(track))
        const index = playable.findIndex(track => track.id === state.activeTrackId)
        if (playable.length > 1) selectTrack(playable[(index + 1) % playable.length])
    })
    const unsubscribePlayer = player.subscribe(renderCurrent)
    const unsubscribeArtist = artistController.subscribe(renderCurrent)
    const unsubscribeConnection = subscribeConnection(() => {
        renderCurrent()
        if (connectionAvailable())
            queueMicrotask(() => {
                if (!disposed) void refresh(true)
            })
    })
    const handleRoute = () => {
        artistController.cancel()
        renderCurrent()
        void refresh()
    }
    router.on('route', handleRoute).listen()
    return () => {
        disposed = true
        generation++
        stopObserving()
        unsubscribeConnection()
        unsubscribePlayer()
        unsubscribeArtist()
        artistController.destroy()
        player.dispose()
        router.off('route', handleRoute).destroy()
    }
}
