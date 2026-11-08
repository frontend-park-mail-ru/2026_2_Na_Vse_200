import { createElement, useState } from '@navse200/my-react'
import { Icon } from '../ui/Icon.tsx'
import { ArtistCover } from '../artist/ArtistCover.tsx'
import { getArtistName, getTrackCover } from '../../features/music/presentation.ts'
import { favorites } from '../../features/music/favorites.ts'
import type { CatalogStatus, Track } from '../../types/domain.ts'
import './TrackList.scss'

interface Props<T extends Track> {
    tracks: T[]
    activeTrack?: { id: Track['id'] }
    onTrackSelect: (track: T) => void
    status?: CatalogStatus
    error?: string
    onRetry?: () => void
    columns?: boolean
}

function formatDuration(track: Track) {
    const duration = track.duration ?? track.duration_seconds ?? (track.duration_ms ?? 0) / 1000
    if (typeof duration === 'string' && /^\d+:\d{2}$/.test(duration)) return duration
    const seconds = Number(
        typeof duration === 'object' ? (duration.seconds ?? duration.duration_seconds ?? 0) : duration,
    )
    if (!Number.isFinite(seconds) || seconds <= 0) return '—:——'
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

export function TrackList<T extends Track>({
    tracks,
    activeTrack,
    onTrackSelect,
    status = 'ready',
    error = '',
    onRetry,
    columns = false,
}: Props<T>) {
    const [menuTrack, setMenuTrack] = useState<Track['id'] | null>(null)
    if (status === 'loading')
        return (
            <p className="track-list-message" aria-live="polite">
                Загружаем треки…
            </p>
        )
    if (status === 'error')
        return (
            <div className="track-list-message" role="alert">
                <span>{error}</span>
                <button type="button" onClick={onRetry}>
                    Попробовать ещё раз
                </button>
            </div>
        )
    if (!tracks.length) return <p className="track-list-message">Пока нет треков.</p>
    return (
        <ol className={`track-list${columns ? ' track-list--columns' : ''}`} aria-label="Популярные треки">
            {tracks.map((track, index) => {
                const liked = favorites.isLiked(track.id)
                const canToggle = favorites.canToggle(track.id)
                return (
                    <li
                        className={`track-list__item${activeTrack?.id === track.id ? ' track-list__item--active' : ''}`}
                        key={track.id}
                    >
                        <button
                            className="track-list__select"
                            type="button"
                            onClick={() => onTrackSelect(track)}
                            aria-current={activeTrack?.id === track.id ? 'true' : undefined}
                        >
                            <span className="track-list__index">{index + 1}</span>
                            <ArtistCover className="track-list__cover" src={getTrackCover(track)} name="" />
                            <span className="track-list__meta">
                                <strong>{track.title || 'Без названия'}</strong>
                                <small>{getArtistName(track)}</small>
                            </span>
                            <span className="track-list__duration">{formatDuration(track)}</span>
                        </button>
                        <button
                            className="track-list__like"
                            type="button"
                            disabled={!canToggle}
                            aria-label={`${liked ? 'Убрать из' : 'Добавить в'} избранное: ${track.title}`}
                            aria-pressed={liked ? 'true' : 'false'}
                            onClick={() => void favorites.toggle(track.id)}
                        >
                            <Icon name="heart" size={21} />
                        </button>
                        <button
                            className="track-list__more"
                            type="button"
                            aria-label={`Действия с треком ${track.title}`}
                            aria-expanded={menuTrack === track.id ? 'true' : 'false'}
                            onClick={() => setMenuTrack(menuTrack === track.id ? null : track.id)}
                        >
                            <Icon name="more" size={22} />
                        </button>
                        {menuTrack === track.id && (
                            <div className="track-list__menu">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onTrackSelect(track)
                                        setMenuTrack(null)
                                    }}
                                >
                                    Слушать
                                </button>
                                <button
                                    type="button"
                                    disabled={!canToggle}
                                    onClick={() => {
                                        void favorites.toggle(track.id)
                                        setMenuTrack(null)
                                    }}
                                >
                                    {liked ? 'Убрать из избранного' : 'Добавить в избранное'}
                                </button>
                            </div>
                        )}
                    </li>
                )
            })}
        </ol>
    )
}
