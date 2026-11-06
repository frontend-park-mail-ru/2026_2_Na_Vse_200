import { getCurrentUser, logout } from '../features/auth/api.js'
import { createStore } from '../shared/lib/store.js'

export const createSession = () => {
    const store = createStore({ user: null, status: 'idle', error: '', pending: false })
    let request = null
    const cancel = () => {
        request?.abort()
        request = null
    }
    const setUser = user => {
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
            const user = await getCurrentUser(controller.signal)
            if (!controller.signal.aborted) setUser(user)
        } catch (error) {
            if (!controller.signal.aborted) {
                request = null
                store.setState({ status: 'error', error: error.message })
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
            await logout(controller.signal)
            if (controller.signal.aborted) return false
            setUser(null)
            return true
        } catch (error) {
            if (!controller.signal.aborted) {
                request = null
                store.setState({ pending: false, error: error.message })
            }
            return false
        }
    }
    return { ...store, restore, setUser, clear: () => setUser(null), signOut, destroy: cancel }
}
