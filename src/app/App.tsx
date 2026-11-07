import { createElement, render } from '@navse200/my-react'
import { createPlayer } from '../shared/audio/player.ts'
import { connectionAvailable, observeConnection, subscribeConnection } from '../shared/offline/network.ts'
import { artistFeature } from '../features/artist/feature.ts'
import { getCacheScope } from '../shared/offline/storage.ts'
import { appStore } from './store.ts'
import { createSession } from './session.ts'
import { AppLayout } from '../components/layout/AppLayout.tsx'
import { ModalHost } from '../components/modal/ModalHost.tsx'
import { modals } from '../components/modal/manager.ts'
import { HomePage } from '../pages/HomePage.tsx'
import { ProfilePage } from '../pages/ProfilePage.tsx'
import { LoginPage } from '../pages/LoginPage.tsx'
import { SignupPage } from '../pages/SignupPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import type { User, Track, EntityId } from '../types/domain.ts'
import type { VanillaRouter } from '../shared/lib/VanillaRouter.ts'

const titles: Record<string, string> = {
    home: 'Главная',
    profile: 'Профиль',
    artist: artistFeature.title,
    login: 'Вход',
    signup: 'Регистрация',
    'not-found': 'Страница не найдена',
}

/** One TS host for the profile/session from dev and the artist/offline features from MUSIC-51. */
export function mountApp(container: HTMLElement, router: VanillaRouter) {
    const stopObserving = observeConnection()
    appStore.reset()
    const session = createSession()
    const player = createPlayer()
    const artist = artistFeature.createController()
    let disposed = false
    let initial = true
    let notice = ''
    let selectedTrack: Track | undefined
    let activeTrackId: EntityId | undefined
    let queue: Track[] = []

    const registered = () => {
        notice = 'Аккаунт создан. Войдите, используя свою почту и пароль.'
        router.navigate('/login')
    }
    const authenticated = (user: User) => {
        const next = router.getCurrentUrl().searchParams.get('next')
        selectedTrack = undefined
        activeTrackId = undefined
        appStore.reset()
        artist.reset()
        session.setUser(user)
        notice = ''
        router.navigate(next === '/profile' ? next : '/')
    }
    const updated = (user: User) => session.setUser(user)
    const expired = () => {
        appStore.reset()
        artist.reset()
        selectedTrack = undefined
        session.clear()
        modals.close()
        notice = 'Сессия истекла. Войдите снова.'
        router.navigate('/login?next=/profile', { replace: true })
    }
    const signOut = async () => {
        if (!connectionAvailable()) return
        if (await session.signOut()) {
            appStore.reset()
            artist.reset()
            selectedTrack = undefined
            activeTrackId = undefined
            modals.close()
            router.navigate('/login')
        }
    }
    const selectTrack = (track: Track) => {
        selectedTrack = track
        activeTrackId = track.id
        renderCurrent()
        void player.play()
    }
    player.setOnEnded(() => {
        const index = queue.findIndex(track => track.id === activeTrackId)
        if (queue.length > 1) selectTrack(queue[(index + 1) % queue.length])
    })
    const retry = async () => {
        await session.restore()
        if (disposed) return
        if (session.getState().status === 'ready') {
            appStore.setState({ catalogStatus: 'idle', offline: false })
        }
        syncRoute(true)
        renderCurrent()
    }

    function renderCurrent(focusHeading = false) {
        if (disposed) return
        const { user, status, error, pending } = session.getState()
        const match = router.findRoute(router.getCurrentUrl().pathname)
        const route = match?.value ?? 'not-found'
        const catalog = appStore.getState()
        const screen = artist.getState()
        const currentArtist = screen.id === match?.params.id ? screen.artist : undefined
        queue = route === 'artist' ? (currentArtist?.tracks ?? []) : catalog.tracks
        const activeTrack = selectedTrack ?? queue.find(track => track.id === activeTrackId) ?? queue[0]
        if (activeTrack) activeTrackId = activeTrack.id
        const needsSession = ['home', 'profile', 'artist'].includes(route)
        const offline =
            !connectionAvailable() || status === 'offline' || (route === 'artist' ? screen.offline : catalog.offline)
        player.setTrack(needsSession ? activeTrack : undefined)
        document.title = `${titles[route] ?? titles['not-found']} — На все 200`

        const renderPage = () => {
            if (needsSession && (status === 'idle' || status === 'loading')) {
                return (
                    <main className="session-loading" aria-live="polite">
                        Проверяем сессию…
                    </main>
                )
            }
            if (needsSession && status === 'error') {
                return (
                    <main className="session-loading" role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={() => void retry()}>
                            Попробовать ещё раз
                        </button>
                    </main>
                )
            }
            switch (route) {
                case 'home':
                    return (
                        <HomePage
                            {...catalog}
                            tracksStatus={catalog.catalogStatus === 'idle' ? 'loading' : catalog.catalogStatus}
                            tracksError={catalog.catalogError}
                            onTracksRetry={() => void appStore.loadCatalog()}
                            activeTrack={activeTrack}
                            onTrackSelect={selectTrack}
                        />
                    )
                case 'artist':
                    return (
                        <artistFeature.Page
                            artist={currentArtist}
                            artistId={match?.params.id ?? ''}
                            tracksStatus={screen.status === 'idle' ? 'loading' : screen.status}
                            tracksError={screen.error}
                            offline={offline}
                            onTracksRetry={() => void artist.load(match?.params.id ?? '', getCacheScope())}
                            activeTrack={activeTrack}
                            onTrackSelect={selectTrack}
                        />
                    )
                case 'profile':
                    return user ? (
                        <fieldset className="offline-auth" disabled={offline}>
                            <ProfilePage
                                user={user}
                                onUserUpdated={updated}
                                onSessionExpired={expired}
                                onLogout={() => void signOut()}
                                authAction={pending}
                            />
                        </fieldset>
                    ) : (
                        <p role="status">Профиль не сохранён. Подключитесь к интернету и войдите.</p>
                    )
                case 'login':
                    return (
                        <fieldset className="offline-auth" disabled={offline}>
                            <LoginPage notice={notice} onAuthenticated={authenticated} />
                        </fieldset>
                    )
                case 'signup':
                    return (
                        <fieldset className="offline-auth" disabled={offline}>
                            <SignupPage onRegistered={registered} />
                        </fieldset>
                    )
                default:
                    return <NotFoundPage />
            }
        }
        const page = renderPage()
        const waiting = needsSession && ['idle', 'loading', 'error'].includes(status)
        render(
            <div className="application">
                {offline ? (
                    <div className="offline-banner" role="status">
                        Нет соединения. Доступны сохранённые экраны; вход и изменения требуют интернета.
                        <button type="button" onClick={() => void retry()}>
                            Проверить соединение
                        </button>
                    </div>
                ) : null}
                {waiting ? (
                    page
                ) : (
                    <AppLayout
                        player={player}
                        tracks={queue}
                        route={route}
                        user={user}
                        onLogout={() => void signOut()}
                        onTrackSelect={selectTrack}
                        activeTrack={activeTrack}
                        sessionError={error}
                        authAction={pending}
                        offline={offline}
                    >
                        {page}
                    </AppLayout>
                )}
                <ModalHost />
            </div>,
            container,
        )
        if (!initial && focusHeading) {
            container.querySelector<HTMLElement>('h1')?.focus()
            window.scrollTo(0, 0)
        }
        initial = false
    }

    function syncRoute(force = false) {
        if (disposed) return
        const match = router.findRoute(router.getCurrentUrl().pathname)
        const route = match?.value
        if (!['home', 'profile', 'artist'].includes(route ?? '')) return
        const { user, status } = session.getState()
        if (status === 'idle') {
            void session.restore().then(() => {
                if (!disposed) syncRoute()
            })
            return
        }
        if (status === 'ready' && !user && route !== 'artist') {
            appStore.reset()
            artist.reset()
            selectedTrack = undefined
            router.navigate(route === 'profile' ? '/login?next=/profile' : '/signup', { replace: true })
            return
        }
        if (status !== 'ready' && status !== 'offline') return
        if (route === 'home' && appStore.getState().catalogStatus === 'idle') void appStore.loadCatalog()
        if (
            route === 'artist' &&
            match?.params.id &&
            (force || artist.getState().id !== match.params.id || artist.getState().status === 'idle')
        ) {
            void artist.load(match.params.id, getCacheScope())
        }
    }
    const handleRoute = () => {
        modals.close()
        artist.cancel()
        renderCurrent(true)
        syncRoute(true)
    }
    const unsubscribe = [
        session.subscribe(() => renderCurrent()),
        player.subscribe(() => renderCurrent()),
        artist.subscribe(() => renderCurrent()),
        appStore.subscribe(() => renderCurrent()),
        modals.subscribe(() => renderCurrent()),
        subscribeConnection(() => {
            if (!connectionAvailable()) modals.close()
            renderCurrent()
            if (connectionAvailable())
                queueMicrotask(() => {
                    if (!disposed) void retry()
                })
        }),
    ]
    renderCurrent()
    router.on('route', handleRoute).listen()
    return () => {
        disposed = true
        unsubscribe.forEach(stop => stop())
        stopObserving()
        session.destroy()
        artist.destroy()
        player.dispose()
        router.off('route', handleRoute).destroy()
        modals.close()
        render(null, container)
    }
}
