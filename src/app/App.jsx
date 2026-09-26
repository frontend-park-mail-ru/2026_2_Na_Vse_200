import { createElement, render } from '../../index.js';
import { appStore } from './store.js';
import { getCurrentUser, logout } from '../features/auth/api.js';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { HomePage } from '../pages/HomePage.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { SignupPage } from '../pages/SignupPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

const pages = {
    home: { component: HomePage, title: 'Главная' },
    login: { component: LoginPage, title: 'Вход' },
    signup: { component: SignupPage, title: 'Регистрация' },
    'not-found': { component: NotFoundPage, title: 'Страница не найдена' },
};

/**
 * Mount the application shell, music page, and authentication screens.
 * @param {HTMLElement} container App root.
 * @param {import('../shared/lib/VanillaRouter.js').VanillaRouter} router Client router.
 * @returns {() => void} Cleanup callback for hot reload.
 */
export function mountApp(container, router) {
    let initial = true;
    let notice = '';
    let user = null;
    let sessionState = 'loading';
    let sessionError = '';
    let authAction = false;
    let activeTrack = appStore.getState().tracks[0];

    const onRegistered = () => {
        notice = 'Аккаунт создан. Войдите, используя свою почту и пароль.';
        router.navigate('/login');
    };

    const onAuthenticated = (nextUser) => {
        user = nextUser;
        sessionError = '';
        notice = 'Вы вошли в аккаунт.';
        router.navigate('/');
    };

    const onLogout = async () => {
        if (authAction) return;
        authAction = true;
        renderCurrent();
        try {
            await logout();
            user = null;
            sessionError = '';
            authAction = false;
            notice = 'Вы вышли из аккаунта.';
            router.navigate('/');
        } catch (error) {
            sessionError = error.message;
            authAction = false;
            renderCurrent();
        }
    };

    const onTrackSelect = (track) => {
        activeTrack = track;
        renderCurrent();
    };

    function renderCurrent() {
        const route = router.getCurrentUrl().pathname;
        const routeName = router.findRoute(route)?.value ?? 'not-found';
        const { component: Page, title } = pages[routeName] ?? pages['not-found'];
        document.title = `${title} — На все 200`;

        if (sessionState === 'loading' && routeName === 'home') {
            render(<main className="session-loading" aria-live="polite">Проверяем сессию…</main>, container);
            return;
        }

        render(<AppLayout
            route={routeName}
            user={user}
            onLogout={onLogout}
            onTrackSelect={onTrackSelect}
            activeTrack={activeTrack}
            sessionError={sessionError}
            authAction={authAction}
        >
            <Page
                tracks={appStore.getState().tracks}
                activeTrack={activeTrack}
                onTrackSelect={onTrackSelect}
                onRegistered={onRegistered}
                onAuthenticated={onAuthenticated}
                notice={notice}
            />
        </AppLayout>, container);

        notice = '';
        if (!initial) {
            container.querySelector('h1')?.focus();
            window.scrollTo(0, 0);
        }
        initial = false;
    }

    const handleRoute = () => renderCurrent();
    router.on('route', handleRoute).listen();

    getCurrentUser().then((nextUser) => {
        user = nextUser;
        sessionState = 'ready';
        renderCurrent();
    }).catch((error) => {
        sessionState = 'error';
        sessionError = error.message;
        renderCurrent();
    });

    return () => router.off('route', handleRoute).destroy();
}
