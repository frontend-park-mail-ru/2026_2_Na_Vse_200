import { isTrack } from './api.ts'
import { isRecord, readApiError, requestJson } from '../../shared/api/request.ts'
import { errorMessage } from '../../shared/lib/forms.ts'
import { createStore } from '../../shared/lib/store.ts'
import type { CatalogStatus, EntityId, Track } from '../../types/domain.ts'
import { playlistHref } from './catalog.ts'

export interface PlaylistDetails {
    name: string
    description: string
    cover: string
    coverFile?: File
}

export interface PlaylistCard {
    id: string
    name: string
    cover: string
    trackCount: number
}

export interface Playlist extends PlaylistCard {
    description: string
    tracks: Track[]
}

interface PlaylistNotice {
    href: string
    message: string
}

interface State {
    items: PlaylistCard[]
    status: CatalogStatus
    error: string
    detail: Playlist | null
    detailStatus: CatalogStatus
    detailError: string
    detailId: string
    notice: PlaylistNotice | null
    importMessage: string
    importFailed: boolean
}

const initial = (): State => ({
    items: [],
    status: 'idle',
    error: '',
    detail: null,
    detailStatus: 'idle',
    detailError: '',
    detailId: '',
    notice: null,
    importMessage: '',
    importFailed: false,
})

function readLocalEntries(key: string): unknown[] {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value : []
}

function isLocalTrack(value: unknown): value is Track {
    return isRecord(value) && (typeof value.id === 'string' || typeof value.id === 'number')
}

function readLocalPlaylist(value: unknown): Playlist | undefined {
    if (
        !isRecord(value) ||
        typeof value.id !== 'string' ||
        typeof value.name !== 'string' ||
        typeof value.description !== 'string' ||
        typeof value.cover !== 'string' ||
        !Array.isArray(value.tracks) ||
        !value.tracks.every(isLocalTrack)
    )
        return
    const { id, name, description, cover, tracks } = value
    return { id, name, description, cover, tracks, trackCount: tracks.length }
}

function parseCard(value: unknown): PlaylistCard {
    if (
        !isRecord(value) ||
        typeof value.id !== 'string' ||
        typeof value.name !== 'string' ||
        (value.cover_url !== null && typeof value.cover_url !== 'string') ||
        typeof value.track_count !== 'number'
    )
        throw new Error('Сервер вернул неверные данные плейлиста.')
    return { id: value.id, name: value.name, cover: value.cover_url ?? '', trackCount: value.track_count }
}

function parsePlaylist(value: unknown): Playlist {
    const card = parseCard(value)
    if (
        !isRecord(value) ||
        typeof value.description !== 'string' ||
        !Array.isArray(value.tracks) ||
        !value.tracks.every(isTrack)
    ) {
        throw new Error('Сервер вернул неверный состав плейлиста.')
    }
    return { ...card, description: value.description, tracks: value.tracks }
}

function detailsForm(details: PlaylistDetails) {
    const body = new FormData()
    body.set('name', details.name)
    body.set('description', details.description)
    if (details.coverFile) body.set('cover', details.coverFile)
    return body
}

const playlistPath = (id: string) => '/playlists/' + encodeURIComponent(id)
const combinedSignal = (signal: AbortSignal) => AbortSignal.any([signal, AbortSignal.timeout(15000)])

export function createPlaylists() {
    const store = createStore(initial())
    let owner: string | null = null
    let session = new AbortController()
    let listRequest: AbortController | undefined
    let detailRequest: AbortController | undefined
    let importRequest: Promise<void> | undefined
    let listRevision = 0

    const requireCurrent = (signal: AbortSignal) => signal.throwIfAborted()

    const publish = (playlist: Playlist, notice?: PlaylistNotice) => {
        listRevision++
        store.setState(state => {
            const items = state.items.some(item => item.id === playlist.id)
                ? state.items.map(item => (item.id === playlist.id ? playlist : item))
                : [playlist, ...state.items]
            const active = state.detailId === playlist.id || state.detail?.id === playlist.id
            if (active) detailRequest?.abort()
            return {
                items,
                ...(active ? { detail: playlist, detailStatus: 'ready' as const, detailError: '' } : {}),
                ...(notice ? { notice } : {}),
            }
        })
    }

    const loadDetail = async (id: string) => {
        if (!owner) return
        detailRequest?.abort()
        const request = new AbortController()
        detailRequest = request
        store.setState({ detailId: id, detail: null, detailStatus: 'loading', detailError: '' })
        try {
            const { response, body } = await requestJson(playlistPath(id), {
                signal: combinedSignal(AbortSignal.any([session.signal, request.signal])),
            })
            if (request.signal.aborted) return
            if (response.status === 404) {
                store.setState({ detailStatus: 'ready' })
                return
            }
            if (!response.ok) throw new Error(readApiError(body).message || 'Не удалось загрузить плейлист.')
            store.setState({ detail: parsePlaylist(body), detailStatus: 'ready' })
        } catch (error) {
            if (!request.signal.aborted) store.setState({ detailStatus: 'error', detailError: errorMessage(error) })
        }
    }

    const loadList = async () => {
        if (!owner) return
        listRequest?.abort()
        const request = new AbortController()
        listRequest = request
        const revision = listRevision
        store.setState({ status: 'loading', error: '' })
        try {
            const { response, body } = await requestJson('/playlists', {
                signal: combinedSignal(AbortSignal.any([session.signal, request.signal])),
            })
            if (request.signal.aborted) return
            if (!response.ok) throw new Error(readApiError(body).message || 'Не удалось загрузить плейлисты.')
            if (!isRecord(body) || !Array.isArray(body.playlists))
                throw new Error('Сервер вернул неверный список плейлистов.')
            if (revision !== listRevision) {
                void loadList()
                return
            }
            store.setState({ items: body.playlists.map(parseCard), status: 'ready' })
        } catch (error) {
            if (!request.signal.aborted) store.setState({ status: 'error', error: errorMessage(error) })
        }
    }

    const importLocal = async (id: string, signal: AbortSignal) => {
        const key = '2une:playlists:user:' + id
        let failed = 0
        let skipped = 0
        try {
            for (const entry of readLocalEntries(key)) {
                if (signal.aborted) return
                const playlist = readLocalPlaylist(entry)
                if (!playlist) {
                    failed++
                    continue
                }
                try {
                    const form = detailsForm(playlist)
                    form.set('legacy_id', playlist.id)
                    form.set('source_account_id', id)
                    form.set('track_ids', JSON.stringify(playlist.tracks.map(track => String(track.id))))
                    if (playlist.cover) {
                        if (!/^data:image\/(?:jpeg|png);base64,/i.test(playlist.cover)) {
                            throw new Error('Не удалось прочитать локальную обложку.')
                        }
                        const cover = await (await fetch(playlist.cover, { signal })).blob()
                        form.set('cover', cover, cover.type === 'image/png' ? 'cover.png' : 'cover.jpg')
                    }
                    const { response, body } = await requestJson('/playlists/import', {
                        method: 'POST',
                        body: form,
                        multipart: true,
                        signal: combinedSignal(signal),
                    })
                    requireCurrent(signal)
                    if (
                        !response.ok ||
                        !isRecord(body) ||
                        !Array.isArray(body.skipped_track_ids) ||
                        !body.skipped_track_ids.every(item => typeof item === 'string')
                    ) {
                        throw new Error(readApiError(body).message || 'Не удалось перенести плейлист.')
                    }
                    const imported = parsePlaylist(body.playlist)
                    skipped += body.skipped_track_ids.length
                    publish(imported)
                    if (store.getState().detailId === playlist.id) void loadDetail(playlist.id)
                    const remaining = readLocalEntries(key).filter(item => !isRecord(item) || item.id !== playlist.id)
                    if (remaining.length) localStorage.setItem(key, JSON.stringify(remaining))
                    else localStorage.removeItem(key)
                } catch {
                    if (signal.aborted) return
                    failed++
                }
            }
        } catch {
            failed++
        }
        if (signal.aborted || (!failed && !skipped)) return
        const warning = skipped ? `При переносе плейлистов пропущено недоступных треков: ${skipped}.` : ''
        const failure = failed
            ? `Не удалось перенести локальные плейлисты: ${failed}. Записи сохранены в браузере.`
            : ''
        store.setState({ importMessage: [warning, failure].filter(Boolean).join(' '), importFailed: Boolean(failed) })
    }

    const startImport = () => {
        if (!owner || importRequest) return
        const signal = session.signal
        const running = importLocal(owner, signal)
        importRequest = running
        void running.finally(() => {
            if (importRequest === running) importRequest = undefined
        })
    }

    const load = (userId: EntityId | null, online: boolean) => {
        const next = userId === null ? null : String(userId)
        if (owner === next) return
        session.abort()
        listRequest?.abort()
        detailRequest?.abort()
        importRequest = undefined
        session = new AbortController()
        owner = next
        store.setState(initial())
        if (next && online) {
            void loadList()
            startImport()
        }
    }

    const ownerSignal = () => {
        if (!owner) throw new Error('Войдите, чтобы управлять плейлистами.')
        return session.signal
    }

    const requestPlaylist = async (path: string, options: Parameters<typeof requestJson>[1]) => {
        const signal = ownerSignal()
        const { response, body } = await requestJson(path, { ...options, signal: combinedSignal(signal) })
        requireCurrent(signal)
        if (!response.ok) throw new Error(readApiError(body).message || 'Не удалось сохранить изменения плейлиста.')
        return parsePlaylist(body)
    }

    const save = async (details: PlaylistDetails, id?: string) => {
        const playlist = await requestPlaylist(id ? playlistPath(id) : '/playlists', {
            method: id ? 'PUT' : 'POST',
            body: detailsForm(details),
            multipart: true,
        })
        publish(playlist)
        return playlist.id
    }

    const changeTracks = async (id: string, added: Track[], removed?: EntityId) => {
        const path = playlistPath(id) + '/tracks'
        const playlist = await requestPlaylist(
            removed === undefined ? path : path + '/' + encodeURIComponent(removed),
            {
                method: removed === undefined ? 'POST' : 'DELETE',
                body:
                    removed === undefined
                        ? JSON.stringify({ track_ids: added.map(track => String(track.id)) })
                        : undefined,
            },
        )
        const active = store.getState()
        const href = playlistHref(active.detail?.id === id ? active.detailId : id)
        publish(playlist, removed === undefined ? { href, message: 'Треки добавлены в плейлист' } : undefined)
    }

    return {
        ...store,
        load,
        loadDetail,
        loadList,
        refresh() {
            void loadList()
            startImport()
        },
        retryImport() {
            store.setState({ importMessage: '', importFailed: false })
            startImport()
        },
        save,
        addTracks: (id: string, tracks: Track[]) => changeTracks(id, tracks),
        removeTrack: (id: string, trackId: EntityId) => changeTracks(id, [], trackId),
        async remove(playlist: Playlist) {
            const signal = ownerSignal()
            const { response, body } = await requestJson(playlistPath(playlist.id), {
                method: 'DELETE',
                signal: combinedSignal(signal),
            })
            requireCurrent(signal)
            if (response.status !== 204) throw new Error(readApiError(body).message || 'Не удалось удалить плейлист.')
            listRevision++
            store.setState(state => ({
                items: state.items.filter(item => item.id !== playlist.id),
                ...(state.detail?.id === playlist.id ? { detail: null } : {}),
                notice: { href: '/library', message: `Плейлист «${playlist.name}» удалён` },
            }))
        },
        clearNotice: () => store.setState({ notice: null }),
        clearDetail() {
            detailRequest?.abort()
            store.setState({ detail: null, detailId: '', detailStatus: 'idle', detailError: '' })
        },
        destroy() {
            session.abort()
            listRequest?.abort()
            detailRequest?.abort()
        },
    }
}
