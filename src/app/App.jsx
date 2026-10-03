import { createElement, render } from '../../index.js'
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
    let notice = ''
    let user = null
    let sessionState = 'loading'
    let sessionError = ''
    let authAction = false
    let tracksStatus = 'loading'
    let tracksError = ''
    let activeTrackId = appStore.getState().tracks[0]?.id

    const onRegistered = () => {
        notice = 'Аккаунт создан. Войдите, используя свою почту и пароль.'
        router.navigate('/')
    }

    const onAuthenticated = nextUser => {
        user = nextUser
        sessionError = ''
        tracksStatus = 'loading'
        tracksError = ''
        router.navigate('/')
        loadCatalog()
    }

    const onLogout = async () => {
        if (authAction) return
        authAction = true
        renderCurrent()
        try {
            await logout()
            user = null
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
        if (!initial) {
            container.querySelector('h1')?.focus()
            window.scrollTo(0, 0)
        }
        initial = false
    }

    const handleRoute = () => renderCurrent()
    router.on('route', handleRoute).listen()

    getCurrentUser()
        .then(nextUser => {
            user = nextUser
            sessionState = 'ready'
            const currentPath = router.getCurrentUrl().pathname
            const currentRoute = router.findRoute(currentPath)?.value
            if (!user && currentRoute === 'home') {
                router.navigate('/signup', { replace: true })
            }
            loadCatalog()
        })
        .catch(error => {
            sessionState = 'error'
            sessionError = error.message
            loadCatalog()
        })

    return () => router.off('route', handleRoute).destroy()
}
