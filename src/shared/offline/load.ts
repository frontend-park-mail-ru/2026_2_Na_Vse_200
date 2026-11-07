import { isNetworkError } from './network.ts'
import { getCacheScope, readCached, writeCached } from './storage.ts'
import type { CacheScope } from './storage.ts'

/** Only transport errors allow fallback. HTTP errors and invalid responses stay visible. */
export async function loadWithCache<T>(key: string, load: () => Promise<T>, scope: CacheScope = getCacheScope()) {
    let data: T
    try {
        data = await load()
    } catch (error) {
        if (!isNetworkError(error)) throw error
        const saved = await readCached<T>(scope.userId, key)
        if (!saved) throw new Error('Этот экран ещё не сохранён. Подключитесь к интернету и откройте его.')
        return { data: saved.data, offline: true }
    }
    await writeCached(scope.userId, key, data, scope)
    return { data, offline: false }
}
