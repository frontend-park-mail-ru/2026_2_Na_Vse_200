import { createElement, render, useState } from '../shared/lib/my-react/index.js'
import { appStore } from './store.js'
import { getCurrentUser, logout } from '../features/auth/api.js'
import { getHomeData } from '../features/music/api.js'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { HomePage } from '../pages/HomePage.jsx'
import { ProfilePage } from '../pages/ProfilePage.tsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { SignupPage } from '../pages/SignupPage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'

const pages = {
    home: { component: HomePage, title: 'Главная' },
    profile: { component: ProfilePage, title: 'Профиль' },
    login: { component: LoginPage, title: 'Вход' },
    signup: { component: SignupPage, title: 'Регистрация' },
    'not-found': { component: NotFoundPage, title: 'Страница не найдена' },
}

// Старт один раз: у нас нет useEffect, поэтому флаги снаружи компонента.
let bootstrapped = false
let handleRoute = null
let sessionRequested = false
let catalogRequested = false
let sessionReady = false
let sessionId = 0

/**
 * Корень SPA: сессия, каталог, активный трек и какая страница по URL.
 * Состояние через useState — setState сам перерисовывает дерево.
 * Сессию проверяем на главной и в профиле, каталог загружаем на главной.
 * @param {{ router: import('../shared/lib/VanillaRouter.js').VanillaRouter }} props Роутер приложения.
 * @returns {object} Разметка текущей страницы.
 */
function App({ router }) {
    const [notice, setNotice] = useState('')
    const [user, setUser] = useState(null)
    const [sessionState, setSessionState] = useState('loading')
    const [sessionError, setSessionError] = useState('')
    const [authAction, setAuthAction] = useState(false)
    const [tracksStatus, setTracksStatus] = useState('loading')
    const [tracksError, setTracksError] = useState('')
    const [activeTrackId, setActiveTrackId] = useState(appStore.getState().tracks[0]?.id)
    const [routeTick, setRouteTick] = useState(0) // для перерисовки при смене url

    const onRegistered = () => {
        setNotice('Аккаунт создан. Войдите, используя свою почту и пароль.')
        router.navigate('/login')
    }

    const onAuthenticated = nextUser => {
        sessionId++
        sessionRequested = true
        sessionReady = true
        setUser(nextUser)
        setSessionState('ready')
        setSessionError('')
        setTracksStatus('loading')
        setTracksError('')
        catalogRequested = false
        const next = router.getCurrentUrl().searchParams.get('next')
        router.navigate(next === '/profile' ? next : '/')
        loadCatalogForHome()
    }

    const onSessionExpired = () => {
        sessionId++
        sessionRequested = false
        sessionReady = false
        catalogRequested = false
        setUser(null)
        setNotice('Сессия истекла. Войдите снова.')
        router.navigate('/login?next=/profile', { replace: true })
    }

    const onLogout = async () => {
        if (authAction) return
        setAuthAction(true)
        try {
            await logout()
            sessionId++
            setUser(null)
            sessionRequested = false
            catalogRequested = false
            sessionReady = false
            setSessionState('loading')
            setSessionError('')
            setAuthAction(false)
            router.navigate('/login')
        } catch (error) {
            setSessionError(error.message)
            setAuthAction(false)
        }
    }

    const onTrackSelect = track => {
        setActiveTrackId(track.id)
    }

    async function loadCatalog() {
        const id = sessionId
        setTracksStatus('loading')
        setTracksError('')
        try {
            const catalog = await getHomeData()
            if (id !== sessionId) return
            const { tracks } = catalog
            appStore.setState(catalog)
            if (!tracks.some(track => track.id === activeTrackId)) {
                setActiveTrackId(tracks[0]?.id)
            }
            setTracksStatus('ready')
        } catch (error) {
            if (id !== sessionId) return
            setTracksStatus('error')
            setTracksError(error.message)
        }
    }

    function loadSession() {
        if (sessionRequested) return
        const currentPath = router.getCurrentUrl().pathname
        const currentRoute = router.findRoute(currentPath)?.value
        if (currentRoute !== 'home' && currentRoute !== 'profile') return

        sessionRequested = true
        const id = ++sessionId
        setSessionState('loading')
        setSessionError('')
        getCurrentUser()
            .then(nextUser => {
                if (id !== sessionId) return
                setUser(nextUser)
                sessionReady = true
                setSessionState('ready')
                const path = router.getCurrentUrl().pathname
                const routeName = router.findRoute(path)?.value
                if (!nextUser) {
                    sessionRequested = false
                    if (routeName === 'profile') router.navigate('/login?next=/profile', { replace: true })
                    if (routeName === 'home') router.navigate('/signup', { replace: true })
                }
                loadCatalogForHome()
            })
            .catch(error => {
                if (id !== sessionId) return
                sessionReady = false
                setSessionState('error')
                setSessionError(error.message)
            })
    }

    function retrySession() {
        sessionRequested = false
        loadSession()
    }

    function loadCatalogForHome() {
        if (!sessionReady || catalogRequested) return
        const currentPath = router.getCurrentUrl().pathname
        const currentRoute = router.findRoute(currentPath)?.value
        if (currentRoute !== 'home') return
        catalogRequested = true
        loadCatalog()
    }

    if (!bootstrapped) {
        bootstrapped = true
        handleRoute = () => {
            setRouteTick(tick => tick + 1)
            // Запросы запускаем после смены страницы.
            queueMicrotask(() => {
                if (!router.started) return
                loadSession()
                loadCatalogForHome()
            })
        }
        router.on('route', handleRoute).listen()
        loadSession()
        loadCatalogForHome()
    }

    void routeTick

    const { tracks, artists, albums } = appStore.getState()
    const activeTrack = tracks.find(track => track.id === activeTrackId) ?? tracks[0]
    const route = router.getCurrentUrl().pathname
    const routeName = router.findRoute(route)?.value ?? 'not-found'
    const { component: Page, title } = pages[routeName] ?? pages['not-found']
    document.title = `${title} — На все 200`

    const needsSession = routeName === 'home' || routeName === 'profile'
    if (needsSession && sessionState === 'error') {
        return (
            <main className="session-loading session-loading--error">
                <p role="alert">{sessionError}</p>
                <button type="button" onClick={retrySession}>
                    Попробовать ещё раз
                </button>
            </main>
        )
    }

    if (needsSession && (sessionState === 'loading' || !user)) {
        return (
            <main className="session-loading" aria-live="polite">
                Проверяем сессию…
            </main>
        )
    }

    return (
        <AppLayout
            tracks={tracks}
            route={routeName}
            user={user}
            onLogout={onLogout}
            onTrackSelect={onTrackSelect}
            activeTrack={activeTrack}
            sessionError={sessionError}
            authAction={authAction}
        >
            <Page
                tracks={tracks}
                artists={artists}
                albums={albums}
                tracksStatus={tracksStatus}
                tracksError={tracksError}
                onTracksRetry={loadCatalog}
                activeTrack={activeTrack}
                onTrackSelect={onTrackSelect}
                onRegistered={onRegistered}
                onAuthenticated={onAuthenticated}
                notice={notice}
                user={user}
                onUserUpdated={setUser}
                onSessionExpired={onSessionExpired}
                onLogout={onLogout}
                authAction={authAction}
            />
        </AppLayout>
    )
}

/**
 * Один раз монтирует App в #root. Дальше UI обновляет setState внутри App.
 * @param {HTMLElement} container Корневой контейнер приложения.
 * @param {import('../shared/lib/VanillaRouter.js').VanillaRouter} router Клиентский роутер.
 * @returns {() => void} Очистка при горячей перезагрузке.
 */
export function mountApp(container, router) {
    render(<App router={router} />, container)
    return () => {
        if (handleRoute) router.off('route', handleRoute)
        router.destroy()
        sessionId++
        bootstrapped = false
        sessionRequested = false
        catalogRequested = false
        sessionReady = false
        handleRoute = null
        render(null, container)
    }
}
