import type { Child } from '@navse200/my-react'
import type { AudioPlayer } from '../../shared/audio/player.ts'
import type { User, Track } from '../../types/domain.ts'

export interface AppLayoutProps {
    user: User | null
    player: AudioPlayer
    route: string
    tracks: Track[]
    activeTrack?: Track
    onTrackSelect: (track: Track) => void
    sessionError: string
    children?: Child
}
