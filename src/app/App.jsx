import { createElement, render, useState } from '../shared/lib/my-react/index.js'
import { appStore } from './store.js'
import { createSession } from './session.js'
import { getHomeData } from '../features/music/api.js'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { ModalHost } from '../components/modal/ModalHost.tsx'
import { modals } from '../components/modal/manager.ts'
import { HomePage } from '../pages/HomePage.jsx'
import { ProfilePage } from '../pages/ProfilePage.tsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { SignupPage } from '../pages/SignupPage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'

const titles = {
    home: 'Главная',
    profile: 'Профиль',
    login: 'Вход',
    signup: 'Регистрация',
    'not-found': 'Страница не найдена',
}
const App = ({ router, session, loadCatalog, resetCatalog, restoreSession }) => {
    const [notice, setNotice] = useState('')
    const [activeTrackId, setActiveTrackId] = useState(appStore.getState().tracks[0]?.id)
    const { user, status, error, pending } = session.getState()
    const catalog = appStore.getState()
    const routeName = router.findRoute(router.getCurrentUrl().pathname)?.value ?? 'not-found'
    const activeTrack = catalog.tracks.find(track => track.id === activeTrackId) ?? catalog.tracks[0]
    const needsSession = routeName === 'home' || routeName === 'profile'
    document.title = titles[routeName] + ' — На все 200'
    const registered = () => {
        setNotice('Аккаунт создан. Войдите, используя свою почту и пароль.')
        router.navigate('/login')
    }
    const authenticated = nextUser => {
        const next = router.getCurrentUrl().searchParams.get('next')
        session.setUser(nextUser)
        resetCatalog()
        router.navigate(next === '/profile' ? next : '/')
    }
    const expired = () => {
        session.clear()
        setNotice('Сессия истекла. Войдите снова.')
        router.navigate('/login?next=/profile', { replace: true })
    }
    const signOut = async () => {
        if (await session.signOut()) router.navigate('/login')
    }
    const selectTrack = track => setActiveTrackId(track.id)
    if (needsSession && status === 'error') {
        return (
            <main className="session-loading session-loading--error">
                <p role="alert">{error}</p>
                <button type="button" onClick={restoreSession}>
                    Попробовать ещё раз
                </button>
            </main>
        )
    }
    if (needsSession && (status !== 'ready' || !user)) {
        return (
            <main className="session-loading" aria-live="polite">
                Проверяем сессию
            </main>
        )
    }
    const renderPage = () => {
        switch (routeName) {
            case 'home':
                return (
                    <HomePage
                        {...catalog}
                        tracksStatus={catalog.status}
                        tracksError={catalog.error}
                        onTracksRetry={loadCatalog}
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
    return (
        <div className="app">
            <AppLayout
                tracks={catalog.tracks}
                route={routeName}
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
        </div>
    )
}
export const mountApp = (container, router) => {
    const session = createSession()
    let request = null
    let disposed = false
    const loadCatalog = async () => {
        if (request) return
        const controller = new AbortController()
        request = controller
        appStore.setState({ status: 'loading', error: '' })
        try {
            const data = await getHomeData(controller.signal)
            if (!controller.signal.aborted) appStore.setState({ ...data, status: 'ready' })
        } catch (error) {
            if (!controller.signal.aborted) appStore.setState({ status: 'error', error: error.message })
        } finally {
            if (request === controller) request = null
        }
    }
    const resetCatalog = () => {
        request?.abort()
        request = null
        appStore.setState({ status: 'idle', error: '' })
    }
    const restoreSession = async () => {
        await session.restore()
        syncRoute()
    }
    const tree = (
        <App
            router={router}
            session={session}
            loadCatalog={loadCatalog}
            resetCatalog={resetCatalog}
            restoreSession={restoreSession}
        />
    )
    const syncRoute = () => {
        if (disposed) return
        const route = router.findRoute(router.getCurrentUrl().pathname)?.value
        if (route !== 'home' && route !== 'profile') return
        const { user, status } = session.getState()
        if (status === 'idle') {
            void restoreSession()
        } else if (status === 'ready' && !user) {
            router.navigate(route === 'profile' ? '/login?next=/profile' : '/signup', { replace: true })
        } else if (route === 'home' && status === 'ready' && appStore.getState().status === 'idle') {
            void loadCatalog()
        }
    }
    const update = () => {
        if (disposed) return
        render(tree, container)
    }
    const routeChanged = () => {
        modals.close()
        update()
        syncRoute()
    }
    const unsubscribe = [session.subscribe(update), appStore.subscribe(update), modals.subscribe(update)]
    render(tree, container)
    router.on('route', routeChanged).listen()
    return () => {
        disposed = true
        router.off('route', routeChanged).destroy()
        unsubscribe.forEach(stop => stop())
        request?.abort()
        session.destroy()
        modals.close()
        render(null, container)
    }
}
