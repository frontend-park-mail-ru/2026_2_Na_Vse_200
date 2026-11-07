import type { Child } from '../../../myReact/index.ts'
import type { AudioPlayer } from '../../features/music/player.ts'
import type { AccountProps, Track } from '../../types/domain.ts'

export interface AppLayoutProps extends AccountProps {
    player: AudioPlayer
    onLocalFile: (file: File) => void
    route: string
    tracks: Track[]
    activeTrack?: Track
    onTrackSelect: (track: Track) => void
    sessionError: string
    children?: Child
}
