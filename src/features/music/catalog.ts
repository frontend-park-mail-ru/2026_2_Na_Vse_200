import type { Catalog, CollectionItem, EntityId, Track } from '../../types/domain.ts'
import { getArtistName, getTrackCover } from './presentation.ts'

const normalize = (text: string) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim()

export const albumHref = (id: EntityId) => `/albums/${encodeURIComponent(id)}`
export const playlistHref = (id: string) => `/playlists/${encodeURIComponent(id)}`
export const albumArtistHref = (id: EntityId, artistId: EntityId) =>
    `${albumHref(id)}?${new URLSearchParams({ artist: String(artistId) })}`

export function matchesQuery(text: string, query: string) {
    const value = normalize(text)
    return normalize(query)
        .split(/\s+/)
        .every(word => value.includes(word))
}

export function searchCatalog(catalog: Catalog, query: string): Catalog {
    if (!query.trim()) return { tracks: [], artists: [], albums: [] }
    const tracks = catalog.tracks.filter(track => matchesQuery(`${track.title ?? ''} ${getArtistName(track)}`, query))
    const artists = new Map<string, CollectionItem>()
    const related = tracks.flatMap(track => track.artists ?? [])
    const relatedNames = new Set(related.map(artist => (typeof artist === 'string' ? artist : artist.name)))
    for (const artist of catalog.artists) {
        if (matchesQuery(artist.name ?? '', query) || relatedNames.has(artist.name))
            artists.set(String(artist.id), artist)
    }
    for (const artist of related) {
        if (typeof artist === 'string' || artist.id == null || !artist.name) continue
        if (!artists.has(String(artist.id))) artists.set(String(artist.id), { id: artist.id, name: artist.name })
    }
    return {
        tracks,
        artists: [...artists.values()],
        albums: catalog.albums.filter(album => matchesQuery(`${album.title ?? ''} ${getArtistName(album)}`, query)),
    }
}

export function getAlbumTracks(album: CollectionItem, tracks: Track[]) {
    const albumArtists = album.artists ?? []
    return tracks.filter(track => {
        const albumId = track.album_id ?? track.album?.id
        if (albumId != null) return String(albumId) === String(album.id)
        // Existing catalog responses expose covers and artist references without an album ID.
        const hasArtist = track.artists?.some(artist =>
            albumArtists.some(item => {
                if (typeof item !== 'string' && typeof artist !== 'string' && item.id != null && artist.id != null) {
                    return String(item.id) === String(artist.id)
                }
                return (
                    (typeof item === 'string' ? item : item.name) ===
                    (typeof artist === 'string' ? artist : artist.name)
                )
            }),
        )
        return Boolean(hasArtist && album.cover_url && getTrackCover(track) === album.cover_url)
    })
}

export function mergeTracks(...lists: Track[][]) {
    return [...new Map(lists.flat().map(track => [String(track.id), track])).values()]
}

export function trackCount(count: number) {
    const form = new Intl.PluralRules('ru').select(count)
    return `${count} ${form === 'one' ? 'трек' : form === 'few' ? 'трека' : 'треков'}`
}
