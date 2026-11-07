import { requestJson } from '../../shared/api/request.js'
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
                if (!response.ok) throw new Error(body?.error?.message || 'Не удалось загрузить исполнителя.')
                if (
                    body?.id !== id ||
                    typeof body.name !== 'string' ||
                    !Array.isArray(body.tracks) ||
                    !Array.isArray(body.albums)
                ) {
                    throw new Error('Сервер вернул данные исполнителя в неизвестном формате.')
                }
                artist = { id: body.id, name: body.name, image_url: body.image_url ?? null }
                tracks.push(...body.tracks)
                albums.push(...body.albums)
                if (body.tracks.length < 100 && body.albums.length < 100) break
            }
            return findArtist({ artists: [artist], tracks, albums }, id)
        },
        scope,
    )
    return { artist: result.data, offline: result.offline }
}
