import { requestJson } from '../../shared/api/request.js'

export class CatalogError extends Error {
    constructor(message, code = '') {
        super(message)
        this.name = 'CatalogError'
        this.code = code
    }
}

/** Преобразует API-трек в вид для отображения. */
export function mapTrack(track) {
    return {
        id: track.id,
        title: track.title,
        artist: (track.artists || []).map(a => a.name).join(', ') || 'Неизвестный',
        album: '—',
        durationSec: Math.round((track.duration_ms || 0) / 1000),
        coverUrl: track.cover_url,
    }
}

/** Данные главной: tracks, artists, albums */
export async function getHome(request = fetch) {
    let response
    let body
    try {
        ;({ response, body } = await requestJson('/home', { method: 'GET' }, request))
    } catch {
        throw new CatalogError('Не удалось загрузить главную. Проверьте соединение.', 'network_error')
    }
    if (response.status === 200) {
        return {
            tracks: body.tracks ?? [],
            artists: body.artists ?? [],
            albums: body.albums ?? [],
        }
    }
    throw new CatalogError('Не удалось загрузить главную. Попробуйте ещё раз.', body?.error?.code || 'home_error')
}