import { getAlbum, getSearch } from './api.ts'
import type { AlbumDetail, SearchKind, SearchResults } from './api.ts'
import { createStore } from '../../shared/lib/store.ts'
import { errorMessage } from '../../shared/lib/forms.ts'
import type { CatalogStatus } from '../../types/domain.ts'

interface SearchState {
    query: string
    kind: SearchKind
    results: SearchResults
    status: CatalogStatus
    error: string
    loadingMore: boolean
    offset: number
}

const emptyResults = (): SearchResults => ({
    tracks: [],
    artists: [],
    albums: [],
    hasMore: { tracks: false, artists: false, albums: false },
})

export function createSearch(allowEmpty = false) {
    const initial = (): SearchState => ({
        query: '',
        kind: allowEmpty ? 'tracks' : 'all',
        results: emptyResults(),
        status: 'idle',
        error: '',
        loadingMore: false,
        offset: 0,
    })
    const store = createStore(initial())
    let request: AbortController | undefined
    let timer: ReturnType<typeof setTimeout> | undefined

    const cancel = () => {
        request?.abort()
        request = undefined
        clearTimeout(timer)
    }

    const run = async (query: string, kind: SearchKind, offset: number) => {
        const controller = new AbortController()
        request = controller
        try {
            const results = await getSearch(
                query,
                kind,
                offset,
                AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
            )
            if (request !== controller) return
            const previous = store.getState().results
            store.setState({
                results: offset
                    ? {
                          tracks: [...previous.tracks, ...results.tracks],
                          artists: [...previous.artists, ...results.artists],
                          albums: [...previous.albums, ...results.albums],
                          hasMore: results.hasMore,
                      }
                    : results,
                status: 'ready',
                loadingMore: false,
                offset,
                error: '',
            })
        } catch (error) {
            if (request === controller) {
                store.setState({ status: offset ? 'ready' : 'error', loadingMore: false, error: errorMessage(error) })
            }
        }
    }

    const load = (input: string, kind: SearchKind, delay = 0) => {
        const query = input.trim()
        cancel()
        if (!query && !allowEmpty) {
            store.setState({ ...initial(), status: 'ready', kind })
            return
        }
        store.setState({ ...initial(), query, kind, status: 'loading' })
        if (delay) timer = setTimeout(() => void run(query, kind, 0), delay)
        else void run(query, kind, 0)
    }

    return {
        ...store,
        load,
        reset() {
            cancel()
            store.setState(initial())
        },
        more() {
            const { query, kind, offset, loadingMore, results } = store.getState()
            if (kind === 'all' || loadingMore || !results.hasMore[kind]) return
            store.setState({ loadingMore: true, error: '' })
            void run(query, kind, offset + 20)
        },
        retry() {
            const { query, kind } = store.getState()
            load(query, kind)
        },
        cancel,
    }
}

interface AlbumState {
    id: string
    album: AlbumDetail | null
    status: CatalogStatus
    offline: boolean
    error: string
}

export function createAlbum() {
    const initial = (): AlbumState => ({ id: '', album: null, status: 'idle', offline: false, error: '' })
    const store = createStore(initial())
    let request: AbortController | undefined
    const cancel = () => {
        request?.abort()
        request = undefined
    }
    return {
        ...store,
        async load(id: string) {
            cancel()
            const controller = new AbortController()
            request = controller
            store.setState({ ...initial(), id, status: 'loading' })
            try {
                const album = await getAlbum(id, AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]))
                if (request === controller) store.setState({ ...album, status: 'ready' })
            } catch (error) {
                if (request === controller) store.setState({ status: 'error', error: errorMessage(error) })
            }
        },
        reset() {
            cancel()
            store.setState(initial())
        },
        cancel,
    }
}
