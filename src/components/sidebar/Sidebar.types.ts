import type { User } from '../../types/domain.ts'
import type { PlaylistCard } from '../../features/music/playlists.ts'

export interface SidebarProps {
    user: User | null
    route: string
    className?: string
    playlists: PlaylistCard[]
    favoriteCount: number
    playlistId?: string
    onCreate?: () => void
}
