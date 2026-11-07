import { isRecord, readApiError, requestJson } from '../../shared/api/request.ts'
import { loadWithCache } from '../../shared/offline/load.ts'
import { findArtist } from './catalog.ts'
import type { CatalogAlbum, CatalogArtist, CatalogTrack } from './catalog.ts'
import type { CacheScope } from '../../shared/offline/storage.ts'
import type { Artist } from './types.ts'

export interface ArtistResult {
    artist: Artist | undefined
    offline: boolean
}

/** Страница исполнителя загружается независимо от выдачи главной. */
export async function getArtistData(id: string, scope?: CacheScope, signal?: AbortSignal): Promise<ArtistResult> {
    const result = await loadWithCache(
        `artist:${id}`,
        async () => {
            const tracks: CatalogTrack[] = []
            const albums: CatalogAlbum[] = []
            let artist: CatalogArtist
            for (let offset = 0; ; offset += 100) {
                const { response, body } = await requestJson(
                    `/artists/${encodeURIComponent(id)}?limit=100&offset=${offset}`,
                    { method: 'GET', signal },
                )
                if (response.status === 404) return undefined
                if (!response.ok) throw new Error(readApiError(body).message || 'Не удалось загрузить исполнителя.')
                if (
                    !isRecord(body) ||
                    body.id !== id ||
                    typeof body.name !== 'string' ||
                    !Array.isArray(body.tracks) ||
                    !Array.isArray(body.albums)
                ) {
                    throw new Error('Сервер вернул данные исполнителя в неизвестном формате.')
                }
                artist = { id: body.id, name: body.name, image_url: image(body.image_url) }
                tracks.push(...body.tracks.map(track))
                albums.push(...body.albums.map(album))
                if (body.tracks.length < 100 && body.albums.length < 100) break
            }
            return findArtist({ artists: [artist], tracks, albums }, id)
        },
        scope,
    )
    return { artist: result.data, offline: result.offline }
}

function image(value: unknown): string | null {
    if (value == null) return null
    if (typeof value === 'string') return value
    throw new Error('Сервер вернул неверный адрес изображения.')
}

function reference(value: unknown): CatalogArtist {
    if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
        throw new Error('Сервер вернул неверные данные исполнителя трека.')
    }
    return { id: value.id, name: value.name, image_url: image(value.image_url) }
}

function track(value: unknown): CatalogTrack {
    if (
        !isRecord(value) ||
        typeof value.id !== 'string' ||
        typeof value.title !== 'string' ||
        typeof value.duration_ms !== 'number' ||
        !Number.isFinite(value.duration_ms) ||
        !Array.isArray(value.artists)
    ) {
        throw new Error('Сервер вернул неверные данные трека.')
    }
    return {
        id: value.id,
        title: value.title,
        duration_ms: value.duration_ms,
        cover_url: image(value.cover_url),
        artists: value.artists.map(reference),
        is_liked: value.is_liked === true,
    }
}

function album(value: unknown): CatalogAlbum {
    if (
        !isRecord(value) ||
        typeof value.id !== 'string' ||
        typeof value.title !== 'string' ||
        !Array.isArray(value.artists)
    ) {
        throw new Error('Сервер вернул неверные данные альбома.')
    }
    return {
        id: value.id,
        title: value.title,
        cover_url: image(value.cover_url),
        artists: value.artists.map(reference),
    }
}
