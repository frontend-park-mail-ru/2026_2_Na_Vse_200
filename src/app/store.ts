import type { Catalog, CatalogStatus } from '../types/domain.ts'
import { errorMessage } from '../shared/lib/forms.ts'
import { getHomeData } from '../features/music/api.ts'
import { getCacheScope } from '../shared/offline/storage.ts'

import { createStore } from '../shared/lib/store.ts'

interface AppState extends Catalog {
    status: CatalogStatus
    error: string
    offline: boolean
}
const store = createStore<AppState>({
    tracks: [],
    artists: [],
    albums: [],
    status: 'idle',
    error: '',
    offline: false,
})

let catalogRequest: Promise<(Catalog & { offline: boolean }) | null> | null = null
let controller: AbortController | null = null

/** Повторный вызов использует текущий запрос; ответ отменённого запроса не меняет каталог. */
const loadCatalog = async () => {
    if (catalogRequest) return catalogRequest
    const request = new AbortController()
    controller = request
    store.setState({ status: 'loading', error: '' })
    const pending = getHomeData(fetch, getCacheScope(), request.signal)
        .then(catalog => {
            if (request.signal.aborted) return null
            store.setState({
                ...catalog,
                status: 'ready',
                error: '',
            })
            return catalog
        })
        .catch(error => {
            if (request.signal.aborted) return null
            store.setState({ status: 'error', error: errorMessage(error) })
            return null
        })
        .finally(() => {
            if (catalogRequest === pending) catalogRequest = null
        })
    catalogRequest = pending
    return pending
}

const reset = () => {
    controller?.abort()
    controller = null
    catalogRequest = null
    store.setState({ tracks: [], artists: [], albums: [], status: 'idle', error: '', offline: false })
}

export const appStore = {
    ...store,
    loadCatalog,
    reset,
}
