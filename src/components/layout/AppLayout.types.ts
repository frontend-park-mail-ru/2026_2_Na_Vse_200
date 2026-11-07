import type { Child } from '@navse200/my-react'
import type { AudioPlayer } from '../../shared/audio/player.ts'
import type { AccountProps, Track } from '../../types/domain.ts'

export interface AppLayoutProps extends AccountProps {
    player: AudioPlayer
    offline?: boolean
    route: string
    tracks: Track[]
    activeTrack?: Track
    onTrackSelect: (track: Track) => void
    sessionError: string
    children?: Child
}
