import type { TrackArtist, CatalogStatus } from '../../types/domain.ts'

export interface ArtistTrack {
    id: string
    title: string
    artists: (string | TrackArtist)[]
    cover_url: string | null
    duration: number
    is_liked: boolean
    album_id?: string
}

export interface ArtistAlbum {
    id: string
    title: string
    artist: string
    cover_url: string | null
    artists?: TrackArtist[]
}

export interface Artist {
    id: string
    name: string
    image_url: string | null
    monthly_listeners?: number
    tracks: ArtistTrack[]
    albums: ArtistAlbum[]
}

export interface ArtistPageProps {
    offline?: boolean
    artist?: Artist
    tracksStatus?: CatalogStatus
    tracksError?: string
    onTracksRetry?: () => void
    artistId: string
    activeTrack?: { id: string | number }
    onTrackSelect: (track: ArtistTrack) => void
}
