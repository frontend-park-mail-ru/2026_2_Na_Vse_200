/** @template {object} T @param {T} initial */
export const createStore = initial => {
    let state = initial
    const listeners = new Set()
    return {
        getState: () => state,
        setState: update => {
            const changes = typeof update === 'function' ? update(state) : update
            const next = { ...state, ...changes }
            if (Object.keys(next).every(key => Object.is(next[key], state[key]))) return state
            state = next
            for (const listener of [...listeners]) listener(state)
            return state
        },
        subscribe: listener => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
    }
}
