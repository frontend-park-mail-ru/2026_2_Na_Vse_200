import type { User, Track } from '../types/domain.ts'
import type { VanillaRouter } from '../shared/lib/VanillaRouter.ts'
import { errorMessage } from '../shared/lib/forms.ts'
import { createElement, render } from '../../index.ts'
import { appStore } from './store.ts'
import { getCurrentUser, logout } from '../features/auth/api.ts'
import { AppLayout } from '../components/layout/AppLayout.tsx'
import { HomePage } from '../pages/HomePage.tsx'
import { LoginPage } from '../pages/LoginPage.tsx'
import { SignupPage } from '../pages/SignupPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'

const pages = {
    home: { component: HomePage, title: 'Главная' },
    login: { component: LoginPage, title: 'Вход' },
    signup: { component: SignupPage, title: 'Регистрация' },
    'not-found': { component: NotFoundPage, title: 'Страница не найдена' },
}

/**
 * Запускает приложение и переключает страницы по маршруту.
 * @param {HTMLElement} container Корневой контейнер приложения.
 * @param {import('../shared/lib/VanillaRouter.ts').VanillaRouter} router Клиентский роутер.
 * @returns {() => void} Очистка при горячей перезагрузке.
 */
export function mountApp(container: HTMLElement, router: VanillaRouter) {
    let initial = true
    let notice = ''
    let user: User | null = null
    let sessionState = 'loading'
    let sessionError = ''
    let authAction = false
    let activeTrackId = appStore.getState().tracks[0]?.id

    const onRegistered = () => {
        notice = 'Аккаунт создан. Войдите, используя свою почту и пароль.'
        router.navigate('/')
    }

    const onAuthenticated = (nextUser: User) => {
        user = nextUser
        sessionError = ''
        router.navigate('/')
        appStore.loadCatalog()
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
            sessionError = errorMessage(error)
            authAction = false
            renderCurrent()
        }
    }

    const onTrackSelect = (track: Track) => {
        activeTrackId = track.id
        renderCurrent()
    }

    function renderCurrent() {
        const { tracks, artists, albums, catalogStatus, catalogError } = appStore.getState()
        const activeTrack = tracks.find(track => track.id === activeTrackId) ?? tracks[0]
        const route = router.getCurrentUrl().pathname
        const routeName = router.findRoute(route)?.value ?? 'not-found'
        const { component: Page, title } = pages[routeName as keyof typeof pages] ?? pages['not-found']
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
                    tracksStatus={catalogStatus === 'idle' ? 'loading' : catalogStatus}
                    tracksError={catalogError}
                    onTracksRetry={appStore.loadCatalog}
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
    const unsubscribeStore = appStore.subscribe(() => {
        const { tracks } = appStore.getState()
        if (!tracks.some(track => track.id === activeTrackId)) activeTrackId = tracks[0]?.id
        renderCurrent()
    })
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
            appStore.loadCatalog()
        })
        .catch(error => {
            sessionState = 'error'
            sessionError = errorMessage(error)
            appStore.loadCatalog()
        })

    return () => {
        unsubscribeStore()
        router.off('route', handleRoute).destroy()
    }
}
