import { getCurrentUser, logout } from '../features/auth/api.ts'
import { createStore } from '../shared/lib/store.ts'
import { errorMessage } from '../shared/lib/forms.ts'
import type { User } from '../types/domain.ts'
import { isNetworkError } from '../shared/offline/network.ts'
import { getSavedUser, rememberUser, restoreUserScope } from '../shared/offline/storage.ts'

interface SessionState {
    user: User | null
    status: 'idle' | 'loading' | 'ready' | 'offline' | 'error'
    error: string
    pending: boolean
}

export const createSession = () => {
    const store = createStore<SessionState>({ user: null, status: 'idle', error: '', pending: false })
    let request: AbortController | null = null
    let persistence = Promise.resolve()

    const cancel = () => {
        request?.abort()
        request = null
    }

    const setUser = (user: User | null) => {
        cancel()
        persistence = rememberUser(user)
        store.setState({ user, status: 'ready', error: '', pending: false })
    }

    const restore = async () => {
        if (store.getState().status === 'loading') return
        cancel()
        const controller = new AbortController()
        request = controller
        store.setState({ status: 'loading', error: '' })
        try {
            const user = await getCurrentUser(fetch, AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]))
            if (controller.signal.aborted) return
            setUser(user)
            await persistence
        } catch (error) {
            if (controller.signal.aborted) return
            if (isNetworkError(error)) {
                const saved = await getSavedUser()
                if (controller.signal.aborted) return
                restoreUserScope(saved)
                store.setState({ user: saved ?? null, status: 'offline', error: '', pending: false })
            } else {
                store.setState({ status: 'error', error: errorMessage(error) })
            }
            if (request === controller) request = null
        }
    }

    const signOut = async () => {
        if (store.getState().pending) return false
        cancel()
        const controller = new AbortController()
        request = controller
        store.setState({ pending: true, error: '' })
        try {
            await logout(fetch, AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]))
            if (controller.signal.aborted) return false
            setUser(null)
            await persistence
            return true
        } catch (error) {
            if (controller.signal.aborted) return false
            request = null
            store.setState({ pending: false, error: errorMessage(error) })
            return false
        }
    }

    return { ...store, restore, setUser, clear: () => setUser(null), signOut, destroy: cancel }
}
