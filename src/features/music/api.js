import { requestJson } from '../../shared/api/request.js'

/** Данные главной: треки, исполнители и альбомы. */
export async function getHomeData() {
    let result
    try {
        result = await requestJson('/home', { method: 'GET' })
    } catch {
        throw new Error('Не удалось подключиться к серверу. Попробуйте ещё раз.')
    }
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
