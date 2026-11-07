import type { Catalog, CatalogStatus } from '../types/domain.ts'
import { errorMessage } from '../shared/lib/forms.ts'
import { getHomeData } from '../features/music/api.ts'

import { createStore } from '../shared/lib/store.ts'
export { createStore } from '../shared/lib/store.ts'

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
