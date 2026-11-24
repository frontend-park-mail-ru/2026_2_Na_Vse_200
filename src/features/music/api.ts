import type { Catalog, Track, CollectionItem } from '../../types/domain.ts'
import { isRecord, readApiError } from '../../shared/api/request.ts'
import { requestJson } from '../../shared/api/request.ts'
import { loadWithCache } from '../../shared/offline/load.ts'
import { getCacheScope } from '../../shared/offline/storage.ts'
import type { CacheScope } from '../../shared/offline/storage.ts'

/** Данные главной: треки, исполнители и альбомы. */
export async function getHomeData(request = fetch, scope: CacheScope = getCacheScope(), signal?: AbortSignal) {
    const result = await loadWithCache('home', () => fetchHomeData(request, signal), scope)
    return { ...result.data, offline: result.offline }
}

async function fetchHomeData(request: typeof fetch, signal?: AbortSignal): Promise<Catalog> {
    const result = await requestJson('/home', { method: 'GET', signal }, request)
    const { response, body } = result

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Каталог музыки пока недоступен.')
        }
        throw new Error(readApiError(body).message || 'Не удалось загрузить треки.')
    }

    if (!isCatalog(body)) {
        throw new Error('Сервер вернул данные главной в неизвестном формате.')
    }

    return { tracks: body.tracks, artists: body.artists, albums: body.albums }
}

function optionalStrings(value: Record<string, unknown>, keys: string[]): boolean {
    return keys.every(
        key =>
            value[key] === undefined ||
            (['cover_url', 'image_url'].includes(key) && value[key] === null) ||
            typeof value[key] === 'string',
    )
}
function isCollectionItem(value: unknown): value is CollectionItem {
    return (
        isRecord(value) &&
        (typeof value.id === 'string' || typeof value.id === 'number') &&
        optionalStrings(value, ['name', 'title', 'image_url', 'cover_url']) &&
        (value.artists === undefined || (Array.isArray(value.artists) && value.artists.every(isArtist)))
    )
}
function isArtist(value: unknown): boolean {
    return (
        typeof value === 'string' ||
        (isRecord(value) &&
            optionalStrings(value, ['name']) &&
            (value.id === undefined || typeof value.id === 'string' || typeof value.id === 'number'))
    )
}
export function isTrack(value: unknown): value is Track {
    if (!isCollectionItem(value) || !isRecord(value)) return false
    const duration = value.duration
    return (
        optionalStrings(value, ['artist_name', 'cover']) &&
        (value.artist === undefined || isArtist(value.artist)) &&
        (value.album_id == null || typeof value.album_id === 'string' || typeof value.album_id === 'number') &&
        (value.album === undefined ||
            (isRecord(value.album) &&
                optionalStrings(value.album, ['cover_url']) &&
                (value.album.id === undefined ||
                    typeof value.album.id === 'string' ||
                    typeof value.album.id === 'number'))) &&
        ['duration_seconds', 'duration_ms'].every(key => value[key] === undefined || typeof value[key] === 'number') &&
        ['is_liked', 'liked'].every(key => value[key] === undefined || typeof value[key] === 'boolean') &&
        (duration === undefined ||
            typeof duration === 'number' ||
            typeof duration === 'string' ||
            (isRecord(duration) &&
                ['seconds', 'duration_seconds'].every(
                    key => duration[key] === undefined || typeof duration[key] === 'number',
                )))
    )
}
function isCatalog(value: unknown): value is Catalog {
    return (
        isRecord(value) &&
        Array.isArray(value.tracks) &&
        value.tracks.every(isTrack) &&
        Array.isArray(value.artists) &&
        value.artists.every(isCollectionItem) &&
        Array.isArray(value.albums) &&
        value.albums.every(isCollectionItem)
    )
}

export type SearchKind = 'all' | 'tracks' | 'artists' | 'albums'
export type SearchResults = Catalog & { hasMore: Record<Exclude<SearchKind, 'all'>, boolean> }

export async function getSearch(
    query: string,
    type: SearchKind,
    offset: number,
    signal: AbortSignal,
): Promise<SearchResults> {
    const params = new URLSearchParams({ q: query, type, limit: '20', offset: String(offset) })
    const { response, body } = await requestJson('/search?' + params, { signal })
    if (!response.ok) throw new Error(readApiError(body).message || 'Не удалось загрузить результаты поиска.')
    if (!isCatalog(body) || !isRecord(body) || !isRecord(body.has_more)) {
        throw new Error('Сервер вернул неверные результаты поиска.')
    }
    const { tracks, artists, albums } = body.has_more
    if (typeof tracks !== 'boolean' || typeof artists !== 'boolean' || typeof albums !== 'boolean') {
        throw new Error('Сервер вернул неверные параметры поиска.')
    }
    return { tracks: body.tracks, artists: body.artists, albums: body.albums, hasMore: { tracks, artists, albums } }
}

export interface AlbumDetail extends CollectionItem {
    tracks: Track[]
}

export async function getAlbum(id: string, signal: AbortSignal) {
    const { data, offline } = await loadWithCache(
        'album:' + id,
        async (): Promise<AlbumDetail | null> => {
            const { response, body } = await requestJson('/albums/' + encodeURIComponent(id), { signal })
            if (response.status === 404) return null
            if (!response.ok) throw new Error(readApiError(body).message || 'Не удалось загрузить альбом.')
            if (
                !isCollectionItem(body) ||
                !isRecord(body) ||
                !Array.isArray(body.tracks) ||
                !body.tracks.every(isTrack)
            ) {
                throw new Error('Сервер вернул неверные данные альбома.')
            }
            return { ...body, tracks: body.tracks }
        },
        getCacheScope(),
    )
    return { album: data, offline }
}
