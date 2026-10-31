import { getHomeData } from '../features/music/api.js'

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

const store = createStore({
    tracks: [],
    artists: [],
    albums: [],
    catalogStatus: 'idle',
    catalogError: '',
})

let catalogRequest = null

async function loadCatalog() {
    if (catalogRequest) return catalogRequest

    store.setState({ catalogStatus: 'loading', catalogError: '' })
    catalogRequest = getHomeData()
        .then(catalog => {
            store.setState({
                ...catalog,
                catalogStatus: 'ready',
                catalogError: '',
            })
            return catalog
        })
        .catch(error => {
            store.setState({ catalogStatus: 'error', catalogError: error.message })
            return null
        })
        .finally(() => {
            catalogRequest = null
        })

    return catalogRequest
}

export const appStore = {
    ...store,
    loadCatalog,
}
