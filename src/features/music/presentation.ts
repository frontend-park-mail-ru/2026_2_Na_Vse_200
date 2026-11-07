import type { Track } from '../../types/domain.ts'
/** Подпись исполнителей для строки трека и плеера. */
export function getArtistName(track: Track | undefined) {
    if (Array.isArray(track?.artists)) {
        return track.artists
            .map(artist => (typeof artist === 'string' ? artist : artist?.name))
            .filter(Boolean)
            .join(', ')
    }
    return typeof track?.artist === 'string' ? track.artist : track?.artist?.name || track?.artist_name || 'Исполнитель'
}

export function getTrackCover(track: Track | undefined) {
    return track?.cover_url || track?.cover || track?.image_url || track?.album?.cover_url || ''
}
