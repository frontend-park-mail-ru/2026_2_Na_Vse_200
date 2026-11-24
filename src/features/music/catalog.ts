import type { EntityId } from '../../types/domain.ts'

export const albumHref = (id: EntityId) => `/albums/${encodeURIComponent(id)}`
export const playlistHref = (id: string) => `/playlists/${encodeURIComponent(id)}`
export const albumArtistHref = (id: EntityId, artistId: EntityId) =>
    `${albumHref(id)}?${new URLSearchParams({ artist: String(artistId) })}`

export function trackCount(count: number) {
    const form = new Intl.PluralRules('ru').select(count)
    return `${count} ${form === 'one' ? 'трек' : form === 'few' ? 'трека' : 'треков'}`
}
