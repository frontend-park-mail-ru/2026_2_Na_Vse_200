import { createElement, render } from '../shared/lib/my-react/index.js'
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

/**
 * Запускает приложение и переключает страницы по маршруту.
 * @param {HTMLElement} container Корневой контейнер приложения.
 * @param {import('../shared/lib/VanillaRouter.js').VanillaRouter} router Клиентский роутер.
 * @returns {() => void} Очистка при горячей перезагрузке.
 */
export function mountApp(container, router) {
    let initial = true
    let previousRouteName = null
    let notice = ''
    let user = null
    let sessionState = 'loading'
    let sessionError = ''
    let sessionRequested = false
    let authAction = false
    let tracksStatus = 'loading'
    let tracksError = ''
    let catalogRequested = false
    let activeTrackId = appStore.getState().tracks[0]?.id

    const onRegistered = () => {
        notice = 'Аккаунт создан. Войдите, используя свою почту и пароль.'
        router.navigate('/')
    }

    const onAuthenticated = nextUser => {
        user = nextUser
        sessionState = 'ready'
        sessionError = ''
        tracksStatus = 'loading'
        tracksError = ''
        router.navigate('/')
        loadCatalogForHome()
    }

    const onLogout = async () => {
        if (authAction) return
        authAction = true
        renderCurrent()
        try {
            await logout()
            user = null
            sessionRequested = false
            sessionState = 'loading'
            sessionError = ''
            authAction = false
            router.navigate('/login')
        } catch (error) {
            sessionError = error.message
            authAction = false
            renderCurrent()
        }
    }

    const onTrackSelect = track => {
        activeTrackId = track.id
        renderCurrent()
    }

    async function loadCatalog() {
        tracksStatus = 'loading'
        tracksError = ''
        renderCurrent()
        try {
            const catalog = await getHomeData()
            const { tracks } = catalog
            appStore.setState(catalog)
            if (!tracks.some(track => track.id === activeTrackId)) activeTrackId = tracks[0]?.id
            tracksStatus = 'ready'
        } catch (error) {
            tracksStatus = 'error'
            tracksError = error.message
        }
        renderCurrent()
    }

    function renderCurrent() {
        const { tracks, artists, albums } = appStore.getState()
        const activeTrack = tracks.find(track => track.id === activeTrackId) ?? tracks[0]
        const route = router.getCurrentUrl().pathname
        const routeName = router.findRoute(route)?.value ?? 'not-found'
        const { component: Page, title } = pages[routeName] ?? pages['not-found']
        document.title = `${title} — На все 200`

        if (sessionState === 'loading' && routeName === 'home') {
            render(
                <main className="session-loading" aria-live="polite">
                    Проверяем сессию…
                </main>,
                container,
            )
            return
        }

        render(
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
            </AppLayout>,
            container,
        )

        notice = ''
        if (!initial && previousRouteName !== routeName) {
            container.querySelector('h1')?.focus()
            window.scrollTo(0, 0)
        }
        previousRouteName = routeName
        initial = false
    }

    const handleRoute = () => {
        renderCurrent()
        loadSessionForHome()
        loadCatalogForHome()
    }
    router.on('route', handleRoute).listen()

    function loadSessionForHome() {
        if (sessionRequested) return
        const currentPath = router.getCurrentUrl().pathname
        const currentRoute = router.findRoute(currentPath)?.value
        if (currentRoute !== 'home') return

        sessionRequested = true
        getCurrentUser()
            .then(nextUser => {
                user = nextUser
                sessionState = 'ready'
                const path = router.getCurrentUrl().pathname
                const routeName = router.findRoute(path)?.value
                if (!user && routeName === 'home') {
                    router.navigate('/signup', { replace: true })
                }
                loadCatalogForHome()
            })
            .catch(error => {
                sessionState = 'error'
                sessionError = error.message
                loadCatalogForHome()
            })
    }

    function loadCatalogForHome() {
        if (sessionState === 'loading' || catalogRequested) return
        const currentPath = router.getCurrentUrl().pathname
        const currentRoute = router.findRoute(currentPath)?.value
        if (currentRoute !== 'home') return
        catalogRequested = true
        loadCatalog()
    }

    loadSessionForHome()
    loadCatalogForHome()

    return () => router.off('route', handleRoute).destroy()
}
