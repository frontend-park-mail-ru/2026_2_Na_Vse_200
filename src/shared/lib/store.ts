export function createStore<S extends object>(initialState: S) {
    let state = initialState
    const listeners = new Set<(state: S) => void>()

    return {
        getState() {
            return state
        },

        setState(update: Partial<S> | ((state: S) => Partial<S>)) {
            const changes = typeof update === 'function' ? update(state) : update
            const nextState = { ...state, ...changes }

            if ((Object.keys(nextState) as (keyof S)[]).every(key => Object.is(nextState[key], state[key]))) {
                return state
            }

            state = nextState
            for (const listener of [...listeners]) listener(state)
            return state
        },

        subscribe(listener: (state: S) => void) {
            if (typeof listener !== 'function') {
                throw new TypeError('A store subscriber must be a function.')
            }

            listeners.add(listener)
            return () => listeners.delete(listener)
        },
    }
}
