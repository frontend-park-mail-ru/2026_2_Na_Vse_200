import { createElement } from '../../../index.js';
import { Sidebar } from '../../features/sidebar/Sidebar.jsx';
import { Player } from '../../features/player/Player.jsx';
import './AppLayout.css';

/**
 * Shared layout: auth screens stay focused; the music shell wraps the other routes.
 * @param {object} props Current route, account actions, selected track, and page.
 * @returns {object} Virtual DOM tree.
 */
export function AppLayout({
    route,
    user,
    onLogout,
    onTrackSelect,
    activeTrack,
    sessionError,
    authAction,
    children,
}) {
    if (route === 'signup' || route === 'login') {
        return <main id="main-content" tabIndex={-1}>{children}</main>;
    }

    return <div className="app-shell">
        <a className="skip-link" href="#main-content">К содержимому</a>
        <Sidebar />
        <div className="app-main-column">
            <header className="account-bar">
                {user
                    ? <div className="account-actions">
                        <span className="user-greeting">{user.display_name || user.email}</span>
                        <button className="logout-button" type="button" onClick={onLogout} disabled={authAction}>Выйти</button>
                    </div>
                    : <nav className="account-actions" aria-label="Аккаунт">
                        <a href="/login" data-link>Вход</a>
                        <a href="/signup" data-link>Регистрация</a>
                    </nav>}
            </header>
            {sessionError ? <p className="session-error" role="alert">{sessionError}</p> : null}
            <main className="app-content" id="main-content" tabIndex={-1}>
                {children}
            </main>
        </div>
        <Player track={activeTrack} onTrackSelect={onTrackSelect} />
    </div>;
}
