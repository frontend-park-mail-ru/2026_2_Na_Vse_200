import { isRecord } from '../../shared/api/request.ts'
import { createStore } from '../../shared/lib/store.ts'
import type { EntityId, Track } from '../../types/domain.ts'
import { playlistHref } from './catalog.ts'

export interface PlaylistDetails {
    name: string
    description: string
    cover: string
}

export interface Playlist extends PlaylistDetails {
    id: string
    tracks: Track[]
}

interface PlaylistNotice {
    href: string
    message: string
}

function isPlaylist(value: unknown): value is Playlist {
    return (
        isRecord(value) &&
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.description === 'string' &&
        typeof value.cover === 'string' &&
        Array.isArray(value.tracks) &&
        value.tracks.every(track => isRecord(track) && (typeof track.id === 'string' || typeof track.id === 'number'))
    )
}

export function createPlaylists() {
    const store = createStore<{ items: Playlist[]; notice: PlaylistNotice | null }>({ items: [], notice: null })
    let key = ''

    const read = () => {
        try {
            const data: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
            if (Array.isArray(data)) return data.filter(isPlaylist)
        } catch {
            // The library can still render if browser storage is unavailable.
        }
        return []
    }

    const load = (userId?: EntityId) => {
        const nextKey = `2une:playlists:${userId === undefined ? 'guest' : `user:${userId}`}`
        if (key === nextKey) return
        key = nextKey
        store.setState({ items: read(), notice: null })
    }

    const save = (update: (items: Playlist[]) => Playlist[], notice: PlaylistNotice | null = null) => {
        const items = update(read())
        try {
            localStorage.setItem(key, JSON.stringify(items))
        } catch {
            throw new Error('Не удалось сохранить плейлисты в браузере. Проверьте доступное место.')
        }
        store.setState({ items, notice })
    }

    const change = (id: string, update: (playlist: Playlist) => Playlist, notice: PlaylistNotice | null = null) =>
        save(items => {
            if (!items.some(item => item.id === id)) throw new Error('Плейлист больше недоступен.')
            return items.map(item => (item.id === id ? update(item) : item))
        }, notice)

    return {
        getState: store.getState,
        subscribe: store.subscribe,
        load,
        create(details: PlaylistDetails) {
            const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
            save(items => [...items, { ...details, id, tracks: [] }])
            return id
        },
        edit(id: string, details: PlaylistDetails) {
            change(id, playlist => ({ ...playlist, ...details }))
        },
        addTracks(id: string, tracks: Track[]) {
            change(
                id,
                playlist => {
                    const existing = new Set(playlist.tracks.map(track => String(track.id)))
                    return {
                        ...playlist,
                        tracks: [...playlist.tracks, ...tracks.filter(track => !existing.has(String(track.id)))],
                    }
                },
                { href: playlistHref(id), message: 'Треки добавлены в плейлист' },
            )
        },
        removeTrack(id: string, trackId: EntityId) {
            change(id, playlist => ({
                ...playlist,
                tracks: playlist.tracks.filter(track => String(track.id) !== String(trackId)),
            }))
        },
        remove(playlist: Playlist) {
            save(items => items.filter(item => item.id !== playlist.id), {
                href: '/library',
                message: `Плейлист «${playlist.name}» удалён`,
            })
        },
        clearNotice: () => store.setState({ notice: null }),
    }
}
