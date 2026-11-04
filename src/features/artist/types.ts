export interface ArtistTrack {
    id: string
    title: string
    artists: string[]
    cover_url: string | null
    duration: number
    is_liked: boolean
}

export interface ArtistAlbum {
    id: string
    title: string
    artist: string
    cover_url: string | null
}

export interface Artist {
    id: string
    name: string
    image_url: string | null
    monthly_listeners?: number
    tracks: ArtistTrack[]
    albums: ArtistAlbum[]
}
