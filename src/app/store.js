'use strict'

import tracks from '../features/music/tracks.json'

export function createStore(initialState) {
    let state = initialState
    const listeners = new Set()

    return {
        getState() {
            return state
        },

        setState(update) {
            const changes = typeof update === 'function' ? update(state) : update
            const nextState = { ...state, ...changes }

            if (Object.keys(nextState).every(key => Object.is(nextState[key], state[key]))) {
                return state
            }

            state = nextState
            for (const listener of [...listeners]) listener(state)
            return state
        },

        subscribe(listener) {
            if (typeof listener !== 'function') {
                throw new TypeError('A store subscriber must be a function.')
            }

            listeners.add(listener)
            return () => listeners.delete(listener)
        },
    }
}

export const appStore = createStore({ tracks })
