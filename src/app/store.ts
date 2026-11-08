import type { Catalog, CatalogStatus } from '../types/domain.ts'
import { errorMessage } from '../shared/lib/forms.ts'
import { getHomeData } from '../features/music/api.ts'
import { getCacheScope } from '../shared/offline/storage.ts'

import { createStore } from '../shared/lib/store.ts'

interface AppState extends Catalog {
    catalogStatus: CatalogStatus
    catalogError: string
    offline: boolean
}
const store = createStore<AppState>({
    tracks: [],
    artists: [],
    albums: [],
    catalogStatus: 'idle',
    catalogError: '',
    offline: false,
})

let catalogRequest: Promise<(Catalog & { offline: boolean }) | null> | null = null
let generation = 0
let controller: AbortController | null = null

async function loadCatalog() {
    if (catalogRequest) return catalogRequest
    const version = generation
    controller = new AbortController()
    store.setState({ catalogStatus: 'loading', catalogError: '' })
    const pending = getHomeData(fetch, getCacheScope(), controller.signal)
        .then(catalog => {
            if (version !== generation) return null
            store.setState({
                ...catalog,
                catalogStatus: 'ready',
                catalogError: '',
            })
            return catalog
        })
        .catch(error => {
            if (version !== generation) return null
            store.setState({ catalogStatus: 'error', catalogError: errorMessage(error) })
            return null
        })
        .finally(() => {
            if (catalogRequest === pending) catalogRequest = null
        })
    catalogRequest = pending
    return pending
}

function reset() {
    generation++
    controller?.abort()
    controller = null
    catalogRequest = null
    store.setState({ tracks: [], artists: [], albums: [], catalogStatus: 'idle', catalogError: '', offline: false })
}

export const appStore = {
    ...store,
    loadCatalog,
    reset,
}
