import { createElement, render } from '../../index.js';
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
 * Mount the app and subscribe to route changes without reloading the document.
 * @param {HTMLElement} container Root DOM element.
 * @param {import('../shared/lib/VanillaRouter.js').VanillaRouter} router App router.
 * @returns {() => void} Remove navigation listeners, including during Vite HMR.
 */
export function mountApp(container, router) {
    let initial = true;
    const handleRoute = ({ detail }) => {
        const route = detail.route ?? 'not-found';
        const { component: Page, title } = pages[route] ?? pages['not-found'];
        document.title = `${title} — На все 200`;
        render(<AppLayout route={route}><Page /></AppLayout>, container);
        if (!initial) {
            container.querySelector('h1')?.focus();
            window.scrollTo(0, 0);
        }
        initial = false;
    };

    router.on('route', handleRoute).listen();
    return () => router.off('route', handleRoute).destroy();
}
