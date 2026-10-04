/** Подпись исполнителей для строки трека и плеера. */
export function getArtistName(track) {
    if (Array.isArray(track?.artists)) {
        return track.artists
            .map(artist => (typeof artist === 'string' ? artist : artist?.name))
            .filter(Boolean)
            .join(', ')
    }
    return typeof track?.artist === 'string' ? track.artist : track?.artist?.name || track?.artist_name || 'Исполнитель'
}

export function getTrackCover(track) {
    return track?.cover_url || track?.cover || track?.image_url || track?.album?.cover_url || ''
}
