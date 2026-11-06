import { createElement } from '../../shared/lib/my-react/index.js'
import { Sidebar } from '../sidebar/Sidebar.jsx'
import { Player } from '../player/Player.jsx'
import { UserAvatar } from '../profile/UserAvatar.tsx'
import './AppLayout.css'

/**
 * Вход и регистрация — без плеера и боковой панели. Остальные страницы — с ними.
 * @param {object} props Текущий маршрут, действия с аккаунтом, выбранный трек и страница.
 * @returns {object} Виртуальное DOM-дерево.
 */
export function AppLayout({
    route,
    user,
    onLogout,
    onTrackSelect,
    tracks,
    activeTrack,
    sessionError,
    authAction,
    children,
}) {
    if (route === 'signup' || route === 'login' || route === 'not-found') {
        return (
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
        )
    }

    return (
        <div className="app-shell">
            <a className="app-shell__skip-link" href="#main-content">
                К содержимому
            </a>
            <Sidebar route={route} user={user} onLogout={onLogout} authAction={authAction} />
            <div className="app-shell__main-column">
                <nav className="app-shell__mobile-nav" aria-label="Навигация">
                    <a href="/" data-link>
                        Главная
                    </a>
                    <a
                        href="/profile"
                        data-link
                        aria-label="Открыть профиль"
                        aria-current={route === 'profile' ? 'page' : undefined}
                    >
                        <UserAvatar src={user?.avatar_url} />
                    </a>
                </nav>
                <main className="app-shell__content" id="main-content" tabIndex={-1}>
                    {children}
                </main>
                {sessionError ? (
                    <p className="app-shell__session-error" role="alert">
                        {sessionError}
                    </p>
                ) : null}
            </div>
            <Player track={activeTrack} tracks={tracks} onTrackSelect={onTrackSelect} />
        </div>
    )
}
