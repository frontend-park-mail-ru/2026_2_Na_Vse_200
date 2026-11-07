import type { AppLayoutProps } from './AppLayout.types.ts'
import { createElement } from '../../../myReact/index.ts'
import { Sidebar } from '../sidebar/Sidebar.tsx'
import { Player } from '../player/Player.tsx'
import { UserAvatar } from '../profile/UserAvatar.tsx'
import './AppLayout.css'

export const AppLayout = ({
    player,
    onLocalFile,
    route,
    user,
    onLogout,
    onTrackSelect,
    tracks,
    activeTrack,
    sessionError,
    authAction,
    children,
}: AppLayoutProps) => {
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
            <Player
                player={player}
                onLocalFile={onLocalFile}
                track={activeTrack}
                tracks={tracks}
                onTrackSelect={onTrackSelect}
            />
        </div>
    )
}
