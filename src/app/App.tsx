import type { VNode } from '@navse200/my-react'
import { createElement, render } from '@navse200/my-react'
import { createPlayer } from '../shared/audio/player.ts'
import { connectionAvailable, observeConnection, subscribeConnection } from '../shared/offline/network.ts'
import { artistFeature } from '../features/artist/feature.ts'
import { getCacheScope } from '../shared/offline/storage.ts'
import { appStore } from './store.ts'
import { createSession } from './session.ts'
import { favorites } from '../features/music/favorites.ts'
import { AppLayout } from '../components/layout/AppLayout.tsx'
import { ModalHost } from '../components/modal/ModalHost.tsx'
import { modals } from '../components/modal/manager.ts'
import { HomePage } from '../pages/HomePage.tsx'
import { ProfilePage } from '../pages/ProfilePage.tsx'
import { LogoutDialog } from '../components/profile/LogoutDialog.tsx'
import { AuthPage } from '../pages/AuthPage.tsx'
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

/**
 * Запускает приложение и подписывает его на изменения данных и маршрута.
 * @returns Функцию очистки подписок, запросов и плеера при размонтировании.
 */
export const mountApp = (container: HTMLElement, router: VanillaRouter) => {
    const stopObserving = observeConnection()
    appStore.reset()
    const session = createSession()
    const player = createPlayer()
    const artist = artistFeature.createController()
    void favorites.load(null, true)
    let disposed = false
    let notice = ''
    let selectedTrack: Track | undefined
    let activeTrackId: EntityId | undefined
    let queue: Track[] = []

    const resetMusic = () => {
        selectedTrack = undefined
        activeTrackId = undefined
        appStore.reset()
        artist.reset()
    }

    const registered = () => {
        notice = 'Аккаунт создан. Войдите, используя свою почту и пароль.'
        router.navigate('/login')
    }
    const authenticated = (user: User) => {
        const next = router.getCurrentUrl().searchParams.get('next')
        resetMusic()
        session.setUser(user)
        notice = ''
        router.navigate(next === '/profile' ? next : '/')
    }
    const accountClosed = (message: string, path = '/login') => {
        resetMusic()
        session.clear()
        modals.close()
        notice = message
        router.navigate(path, { replace: true })
    }
    const expired = () => accountClosed('Сессия истекла. Войдите снова.', '/login?next=/profile')
    const signOut = async () => {
        if (!connectionAvailable()) throw new Error('Для выхода из аккаунта подключитесь к интернету.')
        if (!(await session.signOut())) {
            throw new Error(session.getState().error || 'Не удалось выйти из аккаунта. Попробуйте ещё раз.')
        }
        resetMusic()
        modals.close()
        router.navigate('/login')
    }
    const confirmSignOut = () => modals.open(<LogoutDialog onConfirm={signOut} />)
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
        retryFavorites()
        if (session.getState().status === 'ready') {
            appStore.setState({ status: 'idle', offline: false })
        }
        syncRoute(true)
        renderCurrent()
    }

    const retryArtist = () => {
        const match = router.findRoute(router.getCurrentUrl().pathname)
        void artist.load(match?.params.id ?? '', getCacheScope())
    }
    const retryFavorites = () => void favorites.load(session.getState().user?.id ?? null, true)

    const renderCurrent = () => {
        if (disposed) return
        const { user, status, error, pending } = session.getState()
        const match = router.findRoute(router.getCurrentUrl().pathname)
        const route = match?.value ?? 'not-found'
        const catalog = appStore.getState()
        const favoriteState = favorites.getState()
        const screen = artist.getState()
        const currentArtist = screen.id === match?.params.id ? screen.artist : undefined
        queue = route === 'artist' ? (currentArtist?.tracks ?? []) : catalog.tracks
        const activeTrack = selectedTrack ?? queue.find(track => track.id === activeTrackId) ?? queue[0]
        if (activeTrack) activeTrackId = activeTrack.id
        const needsSession = ['home', 'profile', 'artist'].includes(route)
        const data = route === 'artist' ? screen : catalog
        const offline = !connectionAvailable() || status === 'offline' || data.offline
        player.setTrack(needsSession ? activeTrack : undefined)
        document.title = `${titles[route] ?? titles['not-found']} — На все 200`

        const trackProps = {
            activeTrack,
            onTrackSelect: selectTrack,
            tracksStatus: data.status === 'idle' ? ('loading' as const) : data.status,
            tracksError: data.error,
            onTracksRetry: route === 'artist' ? retryArtist : appStore.loadCatalog,
        }
        const pages: Record<string, VNode> = {
            home: <HomePage {...catalog} {...trackProps} />,
            artist: (
                <artistFeature.Page
                    artist={currentArtist}
                    artistId={match?.params.id ?? ''}
                    {...trackProps}
                    offline={offline}
                />
            ),
            profile: user ? (
                <fieldset className="offline-auth" disabled={offline}>
                    <ProfilePage
                        user={user}
                        onUserUpdated={session.setUser}
                        onSessionExpired={expired}
                        onAccountClosed={accountClosed}
                        onLogout={confirmSignOut}
                        authAction={pending}
                    />
                </fieldset>
            ) : (
                <p role="status">Профиль не сохранён. Подключитесь к интернету и войдите.</p>
            ),
            login: <AuthPage key="login" mode="login" notice={notice} onAuthenticated={authenticated} />,
            signup: <AuthPage key="signup" mode="signup" onRegistered={registered} />,
        }
        let page = pages[route] ?? <NotFoundPage />
        if (route === 'login' || route === 'signup') {
            page = (
                <fieldset className="offline-auth" disabled={offline}>
                    {page}
                </fieldset>
            )
        }
        const waiting = needsSession && ['idle', 'loading', 'error'].includes(status)
        if (waiting) {
            page =
                status === 'error' ? (
                    <main className="session-loading" role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={retry}>
                            Попробовать ещё раз
                        </button>
                    </main>
                ) : (
                    <main className="session-loading" aria-live="polite">
                        Проверяем сессию…
                    </main>
                )
        } else {
            page = (
                <AppLayout
                    player={player}
                    tracks={queue}
                    route={route}
                    user={user}
                    onTrackSelect={selectTrack}
                    activeTrack={activeTrack}
                    sessionError={error}
                >
                    {page}
                </AppLayout>
            )
        }
        render(
            <div className="application">
                {offline ? (
                    <div className="offline-banner" role="status">
                        Нет соединения. Доступны сохранённые экраны; вход и изменения требуют интернета.
                        <button className="offline-banner__retry" type="button" onClick={retry}>
                            Проверить соединение
                        </button>
                    </div>
                ) : null}
                {page}
                <ModalHost />
                {favoriteState.error ? (
                    <div className="favorites-error" role="alert">
                        {favoriteState.error}
                        <button className="favorites-error__retry" type="button" onClick={retryFavorites}>
                            Повторить
                        </button>
                    </div>
                ) : null}
            </div>,
            container,
        )
    }

    const syncRoute = (force = false) => {
        if (disposed) return
        const match = router.findRoute(router.getCurrentUrl().pathname)
        const route = match?.value
        if (!['home', 'profile', 'artist'].includes(route ?? '')) return
        const { user, status } = session.getState()
        if (status === 'idle') {
            void session.restore().then(() => syncRoute())
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
        if (route === 'home' && appStore.getState().status === 'idle') void appStore.loadCatalog()
        if (route !== 'artist' || !match?.params.id) return
        const screen = artist.getState()
        if (force || screen.id !== match.params.id || screen.status === 'idle')
            void artist.load(match.params.id, getCacheScope())
    }
    const handleRoute = () => {
        modals.close()
        artist.cancel()
        renderCurrent()
        container.querySelector<HTMLElement>('h1')?.focus()
        window.scrollTo(0, 0)
        syncRoute(true)
    }
    const sessionChanged = () => {
        const { status, user } = session.getState()
        if (status === 'ready' || status === 'offline') void favorites.load(user?.id ?? null)
        renderCurrent()
    }
    const connectionChanged = () => {
        if (!connectionAvailable()) modals.close()
        renderCurrent()
        if (connectionAvailable())
            queueMicrotask(() => {
                if (!disposed) void retry()
            })
    }
    const unsubscribe = [
        session.subscribe(sessionChanged),
        ...[favorites, player, artist, appStore, modals].map(store => store.subscribe(renderCurrent)),
        subscribeConnection(connectionChanged),
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
