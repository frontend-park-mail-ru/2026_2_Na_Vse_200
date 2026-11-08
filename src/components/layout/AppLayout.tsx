import { createElement, useState } from '@navse200/my-react'
import { Sidebar } from '../sidebar/Sidebar.tsx'
import { Player } from '../player/Player.tsx'
import { UserAvatar } from '../profile/UserAvatar.tsx'
import type { AppLayoutProps } from './AppLayout.types.ts'
import './AppLayout.scss'

export function AppLayout({
    route,
    user,
    onTrackSelect,
    tracks,
    activeTrack,
    sessionError,
    player,
    children,
}: AppLayoutProps) {
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
                if (!(event.target as Element | null)?.closest('.player__queue-panel, .player__queue-button'))
                    setQueueOpen(false)
            }}
            onKeyDown={event => {
                if (event.key === 'Escape') setQueueOpen(false)
            }}
        >
            <a className="app-shell__skip-link" href="#main-content">
                К содержимому
            </a>
            <Sidebar className="app-shell__sidebar" route={route} user={user} />
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
