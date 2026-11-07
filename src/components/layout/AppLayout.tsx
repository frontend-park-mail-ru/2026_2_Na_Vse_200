import type { AudioPlayer } from '../../features/music/player.ts'
import type { Child } from '../../../myReact/index.ts'
import type { AccountProps, Track } from '../../types/domain.ts'
interface AppLayoutProps extends AccountProps {
    player: AudioPlayer
    onLocalFile: (file: File) => void
    route: string
    tracks: Track[]
    activeTrack?: Track
    onTrackSelect: (track: Track) => void
    sessionError: string
    children?: Child
}
import { createElement } from '../../../myReact/index.ts'
import { Sidebar } from '../sidebar/Sidebar.tsx'
import { Player } from '../player/Player.tsx'
import './AppLayout.css'

/**
 * Вход и регистрация — без плеера и боковой панели. Остальные страницы — с ними.
 * @param {object} props Текущий маршрут, действия с аккаунтом, выбранный трек и страница.
 * @returns {object} Виртуальное DOM-дерево.
 */
export function AppLayout({
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
}: AppLayoutProps) {
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
            <Sidebar user={user} onLogout={onLogout} authAction={authAction} />
            <div className="app-main-column">
                <main className="app-content" id="main-content" tabIndex={-1}>
                    {children}
                </main>
                {sessionError ? (
                    <p className="session-error" role="alert">
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
