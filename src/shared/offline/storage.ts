import { openDB } from 'idb'
import type { DBSchema } from 'idb'

export interface OfflineUser {
    id: string | number
    display_name: string
    email?: string
    avatar_url?: string | null
}

export interface CachedValue<T> {
    data: T
    savedAt: number
}

interface OfflineDB extends DBSchema {
    entries: {
        key: [string, string]
        value: CachedValue<unknown> & { userId: string; key: string }
        indexes: { owner: string }
    }
    session: { key: string; value: OfflineUser }
}

export interface CacheScope {
    userId: string
    revision: number
}

let activeUser = 'guest'
let revision = 0

function database() {
    return openDB<OfflineDB>('2une-offline', 1, {
        upgrade(db) {
            const entries = db.createObjectStore('entries', { keyPath: ['userId', 'key'] })
            entries.createIndex('owner', 'userId')
            db.createObjectStore('session')
        },
        blocking(_version, _newVersion, event) {
            ;(event.target as IDBDatabase).close()
        },
    })
}

export const getCacheScope = (): CacheScope => ({ userId: activeUser, revision })
export const isCurrentScope = (scope: CacheScope): boolean => scope.userId === activeUser && scope.revision === revision

/** Storage is optional: private mode, quota errors or a missing IDB must not break online requests. */
export async function readCached<T>(userId: string, key: string): Promise<CachedValue<T> | undefined> {
    let db
    try {
        db = await database()
        const entry = await db.get('entries', [userId, key])
        return entry ? { data: entry.data as T, savedAt: entry.savedAt } : undefined
    } catch {
        return undefined
    } finally {
        db?.close()
    }
}

export async function writeCached<T>(userId: string, key: string, data: T, scope = getCacheScope()): Promise<void> {
    let db
    try {
        db = await database()
        if (!isCurrentScope(scope) || scope.userId !== userId) return
        const tx = db.transaction('entries', 'readwrite')
        await tx.store.put({ userId, key, data, savedAt: Date.now() })
        await tx.done
    } catch {
        // An unavailable cache never turns a successful API response into an error.
    } finally {
        db?.close()
    }
}

export async function clearUserCache(userId: string): Promise<void> {
    let db
    try {
        db = await database()
        const tx = db.transaction('entries', 'readwrite')
        let cursor = await tx.store.index('owner').openCursor(userId)
        while (cursor) {
            await cursor.delete()
            cursor = await cursor.continue()
        }
        await tx.done
    } catch {
        // IDB may be disabled by the browser.
    } finally {
        db?.close()
    }
}

export async function getSavedUser(): Promise<OfflineUser | undefined> {
    let db
    try {
        db = await database()
        return await db.get('session', 'last-user')
    } catch {
        return undefined
    } finally {
        db?.close()
    }
}

/** Save only display data, never passwords, session tokens or arbitrary auth response fields. */
export async function rememberUser(user: OfflineUser | null): Promise<void> {
    const previous = activeUser
    activeUser = user?.id != null ? String(user.id) : 'guest'
    revision++
    const scope = getCacheScope()
    let db
    try {
        db = await database()
        if (!isCurrentScope(scope)) return
        const saved = await db.get('session', 'last-user')
        if (!isCurrentScope(scope)) return
        const oldOwner = saved?.id != null ? String(saved.id) : previous
        if (oldOwner !== activeUser && oldOwner !== 'guest') await clearUserCache(oldOwner)
        if (!isCurrentScope(scope)) return
        if (user?.id != null) {
            const display: OfflineUser = {
                id: user.id,
                display_name: user.display_name,
                ...(typeof user.email === 'string' ? { email: user.email } : {}),
                ...(typeof user.avatar_url === 'string' ? { avatar_url: user.avatar_url } : {}),
            }
            await db.put('session', display, 'last-user')
            await writeCached(activeUser, 'profile', display, scope)
        } else {
            await db.delete('session', 'last-user')
            if (previous !== 'guest') await clearUserCache(previous)
        }
    } catch {
        // The server session continues to work even if persistence is unavailable.
    } finally {
        db?.close()
    }
}

/** Select an existing offline scope without claiming that the server session is valid. */
export function restoreUserScope(user: OfflineUser | undefined): void {
    activeUser = user?.id != null ? String(user.id) : 'guest'
    revision++
}
