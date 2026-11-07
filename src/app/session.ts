import { getCurrentUser, logout } from '../features/auth/api.ts'
import { createStore } from '../shared/lib/store.ts'
import { errorMessage } from '../shared/lib/forms.ts'
import type { User } from '../types/domain.ts'

interface SessionState {
    user: User | null
    status: 'idle' | 'loading' | 'ready' | 'error'
    error: string
    pending: boolean
}

export const createSession = () => {
    const store = createStore<SessionState>({ user: null, status: 'idle', error: '', pending: false })
    let request: AbortController | null = null

    const cancel = () => {
        request?.abort()
        request = null
    }

    const setUser = (user: User | null) => {
        cancel()
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
            if (!controller.signal.aborted) setUser(user)
        } catch (error) {
            if (!controller.signal.aborted) {
                request = null
                store.setState({ status: 'error', error: errorMessage(error) })
            }
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
            return true
        } catch (error) {
            if (!controller.signal.aborted) {
                request = null
                store.setState({ pending: false, error: errorMessage(error) })
            }
            return false
        }
    }

    return { ...store, restore, setUser, clear: () => setUser(null), signOut, destroy: cancel }
}
