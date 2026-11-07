import { createElement, render } from '../../myReact/index.ts'
import { createPlayer, getAudioUrl } from '../features/music/player.ts'
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
    login: 'Вход',
    signup: 'Регистрация',
    'not-found': 'Страница не найдена',
}

export const mountApp = (container: HTMLElement, router: VanillaRouter) => {
    const session = createSession()
    const player = createPlayer()
    let disposed = false
    let initial = true
    let notice = ''
    let activeTrackId: EntityId | undefined = appStore.getState().tracks[0]?.id
    let localTrack: Track | undefined
    let localUrl: string | undefined
    let localId = 0

    const registered = () => {
        notice = 'Аккаунт создан. Войдите, используя свою почту и пароль.'
        router.navigate('/login')
    }

    const authenticated = (user: User) => {
        const next = router.getCurrentUrl().searchParams.get('next')
        notice = ''
        session.setUser(user)
        router.navigate(next === '/profile' ? next : '/')
        void appStore.loadCatalog()
    }

    const expired = () => {
        session.clear()
        notice = 'Сессия истекла. Войдите снова.'
        router.navigate('/login?next=/profile', { replace: true })
    }

    const signOut = async () => {
        if (await session.signOut()) router.navigate('/login')
    }

    const selectTrack = (track: Track) => {
        localTrack = undefined
        activeTrackId = track.id
        renderCurrent()
        if (localUrl) URL.revokeObjectURL(localUrl)
        localUrl = undefined
        void player.play()
    }

    const selectLocalFile = (file: File) => {
        const previousUrl = localUrl
        localUrl = URL.createObjectURL(file)
        localTrack = { id: 'local-' + ++localId, title: file.name, audio_url: localUrl, artist_name: 'Локальный файл' }
        renderCurrent()
        if (previousUrl) URL.revokeObjectURL(previousUrl)
        void player.play()
    }

    player.setOnEnded(() => {
        if (localTrack) return
        const tracks = appStore.getState().tracks.filter(track => getAudioUrl(track))
        const index = tracks.findIndex(track => track.id === activeTrackId)
        if (tracks.length > 1) selectTrack(tracks[(index + 1) % tracks.length])
    })

    const restoreSession = async () => {
        await session.restore()
        syncRoute()
    }

    const renderCurrent = (focusHeading = false) => {
        if (disposed) return
        const { user, status, error, pending } = session.getState()
        const catalog = appStore.getState()
        const activeTrack = localTrack ?? catalog.tracks.find(track => track.id === activeTrackId) ?? catalog.tracks[0]
        const route = router.findRoute(router.getCurrentUrl().pathname)?.value ?? 'not-found'
        const needsSession = route === 'home' || route === 'profile'
        document.title = (titles[route] ?? titles['not-found']) + ' — На все 200'
        player.setTrack(user && needsSession ? activeTrack : undefined)

        if (needsSession && status === 'error') {
            render(
                <main className="session-loading session-loading--error">
                    <p role="alert">{error}</p>
                    <button type="button" onClick={restoreSession}>
                        Попробовать ещё раз
                    </button>
                </main>,
                container,
            )
            return
        }

        if (needsSession && (status !== 'ready' || !user)) {
            render(
                <main className="session-loading" aria-live="polite">
                    Проверяем сессию…
                </main>,
                container,
            )
            return
        }

        const renderPage = () => {
            switch (route) {
                case 'home':
                    return (
                        <HomePage
                            tracks={catalog.tracks}
                            artists={catalog.artists}
                            albums={catalog.albums}
                            tracksStatus={catalog.catalogStatus === 'idle' ? 'loading' : catalog.catalogStatus}
                            tracksError={catalog.catalogError}
                            onTracksRetry={appStore.loadCatalog}
                            activeTrack={activeTrack}
                            onTrackSelect={selectTrack}
                        />
                    )
                case 'profile':
                    return (
                        user && (
                            <ProfilePage
                                user={user}
                                onUserUpdated={session.setUser}
                                onSessionExpired={expired}
                                onLogout={signOut}
                                authAction={pending}
                            />
                        )
                    )
                case 'login':
                    return <LoginPage notice={notice} onAuthenticated={authenticated} />
                case 'signup':
                    return <SignupPage onRegistered={registered} />
                default:
                    return <NotFoundPage />
            }
        }

        render(
            <div className="app">
                <AppLayout
                    player={player}
                    onLocalFile={selectLocalFile}
                    tracks={catalog.tracks}
                    route={route}
                    user={user}
                    onLogout={signOut}
                    onTrackSelect={selectTrack}
                    activeTrack={activeTrack}
                    sessionError={error}
                    authAction={pending}
                >
                    {renderPage()}
                </AppLayout>
                <ModalHost />
            </div>,
            container,
        )

        if (!initial && focusHeading) {
            container.querySelector('h1')?.focus()
            window.scrollTo(0, 0)
        }
        initial = false
    }

    const syncRoute = () => {
        if (disposed) return
        const route = router.findRoute(router.getCurrentUrl().pathname)?.value
        if (route !== 'home' && route !== 'profile') return
        const { user, status } = session.getState()
        if (status === 'idle') {
            void restoreSession()
        } else if (status === 'ready' && !user) {
            router.navigate(route === 'profile' ? '/login?next=/profile' : '/signup', { replace: true })
        } else if (route === 'home' && status === 'ready' && appStore.getState().catalogStatus === 'idle') {
            void appStore.loadCatalog()
        }
    }

    const handleRoute = () => {
        modals.close()
        renderCurrent(true)
        syncRoute()
    }
    const unsubscribe = [
        session.subscribe(() => renderCurrent()),
        player.subscribe(() => renderCurrent()),
        modals.subscribe(() => renderCurrent()),
        appStore.subscribe(() => {
            const { tracks } = appStore.getState()
            if (!tracks.some(track => track.id === activeTrackId)) activeTrackId = tracks[0]?.id
            renderCurrent()
        }),
    ]
    renderCurrent()
    router.on('route', handleRoute).listen()

    return () => {
        disposed = true
        unsubscribe.forEach(stop => stop())
        session.destroy()
        player.dispose()
        if (localUrl) URL.revokeObjectURL(localUrl)
        router.off('route', handleRoute).destroy()
        modals.close()
        render(null, container)
    }
}
