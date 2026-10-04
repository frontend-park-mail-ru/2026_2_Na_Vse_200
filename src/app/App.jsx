import { createElement, render, useState } from '../shared/lib/my-react/index.js'
import { appStore } from './store.js'
import { getCurrentUser, logout } from '../features/auth/api.js'
import { getHomeData } from '../features/music/api.js'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { HomePage } from '../pages/HomePage.jsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { SignupPage } from '../pages/SignupPage.jsx'
import { NotFoundPage } from '../pages/NotFoundPage.jsx'

const pages = {
    home: { component: HomePage, title: 'Главная' },
    login: { component: LoginPage, title: 'Вход' },
    signup: { component: SignupPage, title: 'Регистрация' },
    'not-found': { component: NotFoundPage, title: 'Страница не найдена' },
}

// Старт один раз: у нас нет useEffect, поэтому флаг снаружи компонента.
let bootstrapped = false
let handleRoute = null

/**
 * Корень SPA: сессия, каталог, активный трек и какая страница по URL.
 * Состояние через useState — setState сам перерисовывает дерево.
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
    const [routeTick, setRouteTick] = useState(0)  // для перерисовки при смене url

    const onRegistered = () => {
        setNotice('Аккаунт создан. Войдите, используя свою почту и пароль.')
        router.navigate('/login')
    }

    const onAuthenticated = nextUser => {
        setUser(nextUser)
        setSessionError('')
        setTracksStatus('loading')
        setTracksError('')
        router.navigate('/')
        loadCatalog()
    }

    const onLogout = async () => {
        if (authAction) return
        setAuthAction(true)
        try {
            await logout()
            setUser(null)
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
        setTracksStatus('loading')
        setTracksError('')
        try {
            const catalog = await getHomeData()
            const { tracks } = catalog
            appStore.setState(catalog)
            if (!tracks.some(track => track.id === activeTrackId)) {
                setActiveTrackId(tracks[0]?.id)
            }
            setTracksStatus('ready')
        } catch (error) {
            setTracksStatus('error')
            setTracksError(error.message)
        }
    }

    if (!bootstrapped) {
        bootstrapped = true
        handleRoute = () => setRouteTick(tick => tick + 1)
        router.on('route', handleRoute).listen()
        getCurrentUser()
            .then(nextUser => {
                setUser(nextUser)
                setSessionState('ready')
                const currentPath = router.getCurrentUrl().pathname
                const currentRoute = router.findRoute(currentPath)?.value
                if (!nextUser && currentRoute === 'home') {
                    router.navigate('/signup', { replace: true })
                }
                loadCatalog()
            })
            .catch(error => {
                setSessionState('error')
                setSessionError(error.message)
                loadCatalog()
            })
    }

    void routeTick

    const { tracks, artists, albums } = appStore.getState()
    const activeTrack = tracks.find(track => track.id === activeTrackId) ?? tracks[0]
    const route = router.getCurrentUrl().pathname
    const routeName = router.findRoute(route)?.value ?? 'not-found'
    const { component: Page, title } = pages[routeName] ?? pages['not-found']
    document.title = `${title} — На все 200`

    if (sessionState === 'loading' && routeName === 'home') {
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
        bootstrapped = false
    }
}
