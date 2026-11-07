import { createElement, useState } from '@navse200/my-react'
import { Sidebar } from '../sidebar/Sidebar.jsx'
import { Player } from '../player/Player.tsx'
import './AppLayout.css'

/**
 * Вход и регистрация — без плеера и боковой панели. Остальные страницы — с ними.
 * @param {object} props Текущий маршрут, действия с аккаунтом, выбранный трек и страница.
 * @returns {object} Виртуальное DOM-дерево.
 */
export function AppLayout({
    route,
    user,
    onTrackSelect,
    tracks,
    activeTrack,
    sessionError,
    player,
    onLogout,
    authAction,
    offline,
    children,
}) {
    const [queueOpen, setQueueOpen] = useState(false)
    if (route === 'signup' || route === 'login' || route === 'not-found') {
        return (
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
        )
    }

    return (
        <div
            className="app-shell"
            onClick={event => {
                if (!event.target.closest('.player__queue-panel, .player__queue-button')) setQueueOpen(false)
            }}
            onKeyDown={event => {
                if (event.key === 'Escape') setQueueOpen(false)
            }}
        >
            <a className="app-shell__skip-link" href="#main-content">
                К содержимому
            </a>
            <Sidebar className="app-shell__sidebar" user={user} />
            <div className="app-shell__main-column">
                {user && onLogout ? (
                    <div className="app-shell__account-actions">
                        <button
                            type="button"
                            onClick={onLogout}
                            disabled={authAction || offline}
                            title={offline ? 'Для выхода подключитесь к интернету' : undefined}
                        >
                            {authAction ? 'Выходим…' : 'Выйти из аккаунта'}
                        </button>
                    </div>
                ) : null}
                <main className="app-shell__content" id="main-content" tabIndex={-1}>
                    {children}
                </main>
                {sessionError ? (
                    <p className="app-shell__session-error" role="alert">
                        {sessionError}
                    </p>
                ) : null}
            </div>
            <Player
                player={player}
                className="app-shell__player"
                track={activeTrack}
                tracks={tracks}
                onTrackSelect={onTrackSelect}
                queueOpen={queueOpen}
                onQueueToggle={() => setQueueOpen(!queueOpen)}
                onQueueClose={() => setQueueOpen(false)}
            />
        </div>
    )
}
