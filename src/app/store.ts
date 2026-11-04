import type { Catalog, CatalogStatus } from '../types/domain.ts'
import { errorMessage } from '../shared/lib/forms.ts'
import { getHomeData } from '../features/music/api.ts'

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

interface AppState extends Catalog {
    catalogStatus: CatalogStatus
    catalogError: string
}
const store = createStore<AppState>({
    tracks: [],
    artists: [],
    albums: [],
    catalogStatus: 'idle',
    catalogError: '',
})

let catalogRequest: Promise<Catalog | null> | null = null

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
            store.setState({ catalogStatus: 'error', catalogError: errorMessage(error) })
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
