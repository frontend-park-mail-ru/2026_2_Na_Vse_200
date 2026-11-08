import type { ArtistAlbum } from '../../features/artist/types.ts'
import type { Track } from '../../types/domain.ts'

export interface ArtistCoverProps {
    src: string | null
    name: string
    className?: string
}

export interface ArtistLinksProps {
    track: Track
}

export interface ArtistAlbumsProps {
    albums: ArtistAlbum[]
}
