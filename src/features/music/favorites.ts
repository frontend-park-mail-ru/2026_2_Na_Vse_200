import { isTrack } from './api.ts'
import { createStore } from '../../shared/lib/store.ts'
import { isRecord, readApiError, requestJson } from '../../shared/api/request.ts'
import { loadWithCache } from '../../shared/offline/load.ts'
import { getCacheScope, readCached, writeCached } from '../../shared/offline/storage.ts'
import { connectionAvailable } from '../../shared/offline/network.ts'
import type { EntityId, Track } from '../../types/domain.ts'

interface FavoritesState {
    ids: Record<string, boolean>
    tracks: Record<string, Track>
    pending: Record<string, boolean>
    status: 'idle' | 'loading' | 'ready' | 'unavailable' | 'error'
    error: string
}

class UnavailableError extends Error {}

const initial = (): FavoritesState => ({ ids: {}, tracks: {}, pending: {}, status: 'idle', error: '' })
const store = createStore<FavoritesState>(initial())
let owner: string | null | undefined
let generation = 0
let confirmed: Record<string, boolean> = {}
let savedTracks: Record<string, Track> = {}
let persistence = Promise.resolve()
const mutations = new Set<AbortController>()

/** Загружает избранное пользователя; смена аккаунта отменяет незавершённые изменения. */
async function load(userId: EntityId | null, force = false) {
    const next = userId === null ? null : String(userId)
    if (owner === next && !force) return
    owner = next
    for (const controller of mutations) controller.abort()
    mutations.clear()
    const version = ++generation
    confirmed = {}
    savedTracks = {}
    const scope = getCacheScope()
    store.setState({ ...initial(), status: next === null ? 'idle' : 'loading' })
    if (next === null) return
    try {
        let serverTracks: Track[] | undefined
        const [result, cachedTracks] = await Promise.all([
            loadWithCache(
                'favorites',
                async () => {
                    const { response, body } = await requestJson('/favorites')
                    if (response.status === 404 || response.status === 405) {
                        throw new UnavailableError()
                    }
                    if (!response.ok) throw new Error(readApiError(body).message || 'Не удалось загрузить избранное.')
                    if (
                        !isRecord(body) ||
                        !Array.isArray(body.track_ids) ||
                        !body.track_ids.every(id => typeof id === 'string')
                    ) {
                        throw new Error('Сервер вернул неверные данные избранного.')
                    }
                    if (body.tracks !== undefined) {
                        if (!Array.isArray(body.tracks) || !body.tracks.every(isTrack)) {
                            throw new Error('Сервер вернул неверный состав избранного.')
                        }
                        serverTracks = body.tracks
                    }
                    return Object.fromEntries(body.track_ids.map(id => [id, true])) as Record<string, boolean>
                },
                scope,
            ),
            readCached<Record<string, Track>>(scope.userId, 'favorite-tracks'),
        ])
        if (version === generation) {
            confirmed = { ...result.data }
            const tracks = serverTracks
                ? serverTracks.map(track => [String(track.id), track] as const)
                : Object.entries(cachedTracks?.data ?? {})
            savedTracks = Object.fromEntries(tracks.filter(([id]) => confirmed[id]))
            if (serverTracks) {
                const snapshot = savedTracks
                persistence = persistence.then(() => writeCached(scope.userId, 'favorite-tracks', snapshot, scope))
            }
            store.setState({ ids: result.data, tracks: savedTracks, status: 'ready' })
        }
    } catch (error) {
        if (version !== generation) return
        if (error instanceof UnavailableError) {
            store.setState({ status: 'unavailable', error: '' })
            return
        }
        store.setState({
            status: 'error',
            error: error instanceof Error ? error.message : 'Не удалось загрузить избранное.',
        })
    }
}

export const favorites = {
    ...store,
    load,
    isLiked: (id: EntityId) => Boolean(store.getState().ids[String(id)]),
    canToggle: (id: EntityId) =>
        Boolean(owner) &&
        store.getState().status === 'ready' &&
        !store.getState().pending[String(id)] &&
        connectionAvailable(),
    /** Сразу обновляет лайк в интерфейсе и откатывает его при ошибке сервера. */
    async toggle(track: Track) {
        const { id } = track
        if (!favorites.canToggle(id)) return
        const key = String(id)
        const previous = favorites.isLiked(id)
        const version = generation
        const scope = getCacheScope()
        const controller = new AbortController()
        mutations.add(controller)
        store.setState(state => ({
            ids: { ...state.ids, [key]: !previous },
            tracks: previous
                ? Object.fromEntries(Object.entries(state.tracks).filter(([id]) => id !== key))
                : { ...state.tracks, [key]: track },
            pending: { ...state.pending, [key]: true },
            error: '',
        }))
        try {
            const { response, body } = await requestJson(`/tracks/${encodeURIComponent(key)}/favorite`, {
                method: previous ? 'DELETE' : 'PUT',
                signal: controller.signal,
            })
            if (response.status === 404 || response.status === 405) {
                throw new Error('Не удалось сохранить лайк: функция недоступна на сервере.')
            }
            if (response.status !== 204) throw new Error(readApiError(body).message || 'Не удалось сохранить лайк.')
            if (version !== generation) return
            confirmed = { ...confirmed, [key]: !previous }
            savedTracks = { ...savedTracks }
            if (previous) delete savedTracks[key]
            else savedTracks[key] = track
            const snapshot = confirmed
            const trackSnapshot = savedTracks
            persistence = persistence.then(async () => {
                await writeCached(scope.userId, 'favorites', snapshot, scope)
                await writeCached(scope.userId, 'favorite-tracks', trackSnapshot, scope)
            })
            await persistence
        } catch (error) {
            if (version === generation)
                store.setState(state => ({
                    ids: { ...state.ids, [key]: previous },
                    tracks: previous
                        ? { ...state.tracks, [key]: savedTracks[key] ?? track }
                        : Object.fromEntries(Object.entries(state.tracks).filter(([id]) => id !== key)),
                    error: error instanceof Error ? error.message : 'Не удалось сохранить лайк.',
                }))
        } finally {
            mutations.delete(controller)
            if (version === generation) store.setState(state => ({ pending: { ...state.pending, [key]: false } }))
        }
    },
}
