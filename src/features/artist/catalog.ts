import type { Artist } from './types.ts'

interface CatalogArtist {
    id: string
    name: string
    image_url: string | null
}

interface CatalogTrack {
    id: string
    title: string
    cover_url: string | null
    duration_ms: number
    artists: CatalogArtist[]
    is_liked?: boolean
}

interface CatalogAlbum {
    id: string
    title: string
    cover_url: string | null
    artists: CatalogArtist[]
}

interface Catalog {
    artists: CatalogArtist[]
    tracks: CatalogTrack[]
    albums: CatalogAlbum[]
}

export function findArtist(catalog: Catalog, id: string): Artist | undefined {
    const artist = catalog.artists.find(item => item.id === id)
    if (!artist) return undefined

    return {
        ...artist,
        tracks: catalog.tracks
            .filter(track => track.artists.some(item => item.id === id))
            .map(track => ({
                ...track,
                artists: track.artists.map(item => item.name),
                duration: Math.floor(track.duration_ms / 1000),
                is_liked: Boolean(track.is_liked),
            })),
        albums: catalog.albums
            .filter(album => album.artists.some(item => item.id === id))
            .map(album => ({ ...album, artist: album.artists.map(item => item.name).join(', ') })),
    }
}
