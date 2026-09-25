import { createElement } from '../../../index.js';

const links = [
    { route: 'home', href: '/', label: 'Главная' },
    { route: 'signup', href: '/signup', label: 'Регистрация' },
    { route: 'login', href: '/login', label: 'Вход' },
];

/**
 * Shared shell with navigation available on every screen and viewport.
 * @param {{route: string, children: Array<object>}} props Current route and page.
 * @returns {object} Virtual element rendered by the project's own template engine.
 */
export function AppLayout({ route, user, onLogout, sessionError, children }) {
    if (route === 'signup' || route === 'login') return <main id="main-content" tabIndex={-1}>{children}</main>;
    return <div className="app-shell">
        <a className="skip-link" href="#main-content">К содержимому</a>
        <header className="header">
            <a className="logo" href="/" data-link>На все 200</a>
            <nav className="navigation" aria-label="Основная навигация">
                {links.map(link => <a key={link.route} href={link.href} data-link
                    aria-current={route === link.route ? 'page' : undefined}>
                    {link.label}
                </a>)}
                {user ? <><span className="user-greeting">{user.display_name || user.email}</span><button className="logout-button" type="button" onClick={onLogout}>Выйти</button></> : null}
            </nav>
        </header>
        {sessionError ? <p className="session-error" role="alert">{sessionError}</p> : null}
        <main id="main-content" tabIndex={-1}>{children}</main>
    </div>;
}
