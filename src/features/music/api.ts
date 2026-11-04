import type { Catalog, Track, CollectionItem } from '../../types/domain.ts'
import { isRecord, readApiError } from '../../shared/api/request.ts'
import { requestJson } from '../../shared/api/request.ts'

/** Данные главной: треки, исполнители и альбомы. */
export async function getHomeData(request = fetch): Promise<Catalog> {
    let result
    try {
        result = await requestJson('/home', { method: 'GET' }, request)
    } catch {
        throw new Error('Не удалось подключиться к серверу. Попробуйте ещё раз.')
    }
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
    return keys.every(key => value[key] === undefined || typeof value[key] === 'string')
}
function isCollectionItem(value: unknown): value is CollectionItem {
    return (
        isRecord(value) &&
        (typeof value.id === 'string' || typeof value.id === 'number') &&
        optionalStrings(value, ['name', 'title', 'image_url', 'cover_url'])
    )
}
function isArtist(value: unknown): boolean {
    return typeof value === 'string' || (isRecord(value) && optionalStrings(value, ['name']))
}
function isTrack(value: unknown): value is Track {
    if (!isCollectionItem(value) || !isRecord(value)) return false
    const duration = value.duration
    return (
        optionalStrings(value, ['artist_name', 'cover']) &&
        (value.artists === undefined || (Array.isArray(value.artists) && value.artists.every(isArtist))) &&
        (value.artist === undefined || isArtist(value.artist)) &&
        (value.album === undefined || (isRecord(value.album) && optionalStrings(value.album, ['cover_url']))) &&
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
