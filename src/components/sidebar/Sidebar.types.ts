import type { User } from '../../types/domain.ts'
import type { Playlist } from '../../features/music/playlists.ts'

export interface SidebarProps {
    user: User | null
    route: string
    className?: string
    playlists: Playlist[]
    favoriteCount: number
    playlistId?: string
    onCreate: () => void
}
