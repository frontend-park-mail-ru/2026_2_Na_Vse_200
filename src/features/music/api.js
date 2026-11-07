import { requestJson } from '../../shared/api/request.js'
import { loadWithCache } from '../../shared/offline/load.ts'

/** Данные главной: треки, исполнители и альбомы. */
export async function getHomeData(scope) {
    const result = await loadWithCache('home', fetchHomeData, scope)
    return { ...result.data, offline: result.offline }
}

async function fetchHomeData() {
    const result = await requestJson('/home', { method: 'GET' })
    const { response, body } = result

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Каталог музыки пока недоступен.')
        }
        throw new Error(body?.error?.message || 'Не удалось загрузить треки.')
    }

    if (!['tracks', 'artists', 'albums'].every(key => Array.isArray(body?.[key]))) {
        throw new Error('Сервер вернул данные главной в неизвестном формате.')
    }

    return { tracks: body.tracks, artists: body.artists, albums: body.albums }
}
