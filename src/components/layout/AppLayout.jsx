import { createElement } from '../../../index.js'
import { Sidebar } from '../sidebar/Sidebar.jsx'
import { Player } from '../player/Player.jsx'
import './AppLayout.css'

/**
 * Вход и регистрация — без плеера и боковой панели. Остальные страницы — с ними.
 * @param {object} props Текущий маршрут, действия с аккаунтом, выбранный трек и страница.
 * @returns {object} Виртуальное DOM-дерево.
 */
export function AppLayout({ route, user, onLogout, onTrackSelect, activeTrack, sessionError, authAction, children }) {
    if (route === 'signup' || route === 'login') {
        return (
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
        )
    }

    return (
        <div className="app-shell">
            <a className="skip-link" href="#main-content">
                К содержимому
            </a>
            <Sidebar />
            <div className="app-main-column">
                <header className="account-bar">
                    {user ? (
                        <div className="account-actions">
                            <span className="user-greeting">{user.display_name || user.email}</span>
                            <button className="logout-button" type="button" onClick={onLogout} disabled={authAction}>
                                Выйти
                            </button>
                        </div>
                    ) : (
                        <nav className="account-actions" aria-label="Аккаунт">
                            <a href="/login" data-link>
                                Вход
                            </a>
                            <a href="/signup" data-link>
                                Регистрация
                            </a>
                        </nav>
                    )}
                </header>
                {sessionError ? (
                    <p className="session-error" role="alert">
                        {sessionError}
                    </p>
                ) : null}
                <main className="app-content" id="main-content" tabIndex={-1}>
                    {children}
                </main>
            </div>
            <Player track={activeTrack} onTrackSelect={onTrackSelect} />
        </div>
    )
}
