import { createStore } from '../../shared/lib/store.ts'
import { isRecord, readApiError, requestJson } from '../../shared/api/request.ts'
import { loadWithCache } from '../../shared/offline/load.ts'
import { getCacheScope, writeCached } from '../../shared/offline/storage.ts'
import { connectionAvailable } from '../../shared/offline/network.ts'
import type { EntityId } from '../../types/domain.ts'

interface FavoritesState {
    ids: Record<string, boolean>
    pending: Record<string, boolean>
    status: 'idle' | 'loading' | 'ready' | 'unavailable' | 'error'
    error: string
}

class UnavailableError extends Error {}

const initial = (): FavoritesState => ({ ids: {}, pending: {}, status: 'idle', error: '' })
const store = createStore<FavoritesState>(initial())
let owner: string | null | undefined
let generation = 0
let confirmed: Record<string, boolean> = {}
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
    const scope = getCacheScope()
    store.setState({ ...initial(), status: next === null ? 'idle' : 'loading' })
    if (next === null) return
    try {
        const result = await loadWithCache(
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
                return Object.fromEntries(body.track_ids.map(id => [id, true])) as Record<string, boolean>
            },
            scope,
        )
        if (version === generation) {
            confirmed = { ...result.data }
            store.setState({ ids: result.data, status: 'ready' })
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
    async toggle(id: EntityId) {
        if (!favorites.canToggle(id)) return
        const key = String(id)
        const previous = favorites.isLiked(id)
        const version = generation
        const scope = getCacheScope()
        const controller = new AbortController()
        mutations.add(controller)
        store.setState(state => ({
            ids: { ...state.ids, [key]: !previous },
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
            const snapshot = confirmed
            persistence = persistence.then(() => writeCached(scope.userId, 'favorites', snapshot, scope))
            await persistence
        } catch (error) {
            if (version === generation)
                store.setState(state => ({
                    ids: { ...state.ids, [key]: previous },
                    error: error instanceof Error ? error.message : 'Не удалось сохранить лайк.',
                }))
        } finally {
            mutations.delete(controller)
            if (version === generation) store.setState(state => ({ pending: { ...state.pending, [key]: false } }))
        }
    },
}
