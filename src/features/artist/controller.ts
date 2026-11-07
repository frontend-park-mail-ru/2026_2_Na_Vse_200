import { getArtistData } from './api.ts'
import type { ArtistResult } from './api.ts'
import type { Artist } from './types.ts'
import type { CacheScope } from '../../shared/offline/storage.ts'

export interface ArtistScreenState {
    id: string
    artist: Artist | undefined
    status: 'idle' | 'loading' | 'ready' | 'error'
    error: string
    offline: boolean
}

export type ArtistLoader = (id: string, scope?: CacheScope, signal?: AbortSignal) => Promise<ArtistResult>

/** Host-independent loader: can be subscribed by either the TS App in 50 or the session-based App in 53. */
export function createArtistController(load: ArtistLoader = getArtistData) {
    const initial = (): ArtistScreenState => ({ id: '', artist: undefined, status: 'idle', error: '', offline: false })
    let state = initial()
    let request: AbortController | undefined
    let generation = 0
    let disposed = false
    const listeners = new Set<() => void>()
    const update = (next: ArtistScreenState) => {
        state = next
        if (!disposed) for (const listener of listeners) listener()
    }
    const cancel = () => {
        generation++
        request?.abort()
        request = undefined
    }
    return {
        getState: () => state,
        subscribe(listener: () => void) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        cancel,
        reset() {
            cancel()
            update(initial())
        },
        async load(id: string, scope?: CacheScope): Promise<void> {
            if (disposed) return
            cancel()
            const version = generation
            const controller = new AbortController()
            request = controller
            update({ ...initial(), id, artist: state.id === id ? state.artist : undefined, status: 'loading' })
            try {
                const result = await load(id, scope, controller.signal)
                if (disposed || version !== generation) return
                update({ id, artist: result.artist, status: 'ready', error: '', offline: result.offline })
            } catch (error) {
                if (disposed || version !== generation) return
                update({
                    id,
                    artist: undefined,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Не удалось загрузить исполнителя.',
                    offline: false,
                })
            } finally {
                if (request === controller) request = undefined
            }
        },
        destroy() {
            disposed = true
            cancel()
            listeners.clear()
        },
    }
}
