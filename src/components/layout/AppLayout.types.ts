import type { Child } from '@navse200/my-react'
import type { AudioPlayer } from '../../shared/audio/player.ts'
import type { User, Track } from '../../types/domain.ts'
import type { PlaylistCard } from '../../features/music/playlists.ts'

export interface AppLayoutProps {
    user: User | null
    player: AudioPlayer
    route: string
    tracks: Track[]
    activeTrack?: Track
    onTrackSelect: (track: Track) => void
    sessionError: string
    playlists: PlaylistCard[]
    favoriteCount: number
    playlistId?: string
    onCreatePlaylist?: () => void
    children?: Child
}
