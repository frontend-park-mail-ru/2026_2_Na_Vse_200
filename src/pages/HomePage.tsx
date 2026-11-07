import type { Track, CollectionItem, HomePageProps } from '../types/domain.ts'
import type { CoverProps, TrackListProps, CollectionProps } from './HomePage.types.ts'
import { createElement, useState } from '../../myReact/index.ts'
import { Icon } from '../components/ui/Icon.tsx'
import { getArtistName, getTrackCover } from '../features/music/presentation.ts'
import './HomePage.css'

const formatDuration = (duration: Track['duration']) => {
    if (typeof duration === 'string' && /^\d+:\d{2}$/.test(duration)) return duration
    const seconds = Number(
        typeof duration === 'object' ? (duration.seconds ?? duration.duration_seconds ?? 0) : (duration ?? 0),
    )
    if (!Number.isFinite(seconds) || seconds <= 0) return '—:——'
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
const Cover = ({ cover, className = '', icon = 'music' }: CoverProps) => {
    const [failedCover, setFailedCover] = useState('')
    const coverError = () => setFailedCover(cover ?? '')
    return (
        <span className={`music-cover ${className}`}>
            {cover && failedCover !== cover ? (
                <img src={cover} alt="" loading="lazy" onError={coverError} />
            ) : (
                <Icon name={icon} size={20} />
            )}
        </span>
    )
}
const TrackList = ({
    tracks,
    activeTrack,
    onTrackSelect,
    tracksStatus,
    tracksError,
    onTracksRetry,
}: TrackListProps) => {
    const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({})
    if (tracksStatus === 'loading') {
        return (
            <p className="home-page__message" aria-live="polite">
                Загружаем треки…
            </p>
        )
    }
    if (tracksStatus === 'error') {
        return (
            <div className="home-page__message home-page__message--error" role="alert">
                <span>{tracksError}</span>
                <button type="button" onClick={onTracksRetry}>
                    Попробовать ещё раз
                </button>
            </div>
        )
    }
    if (!tracks.length) return <p className="home-page__message">Пока нет треков.</p>
    const renderTrack = (track: Track, index: number) => {
        const isActive = activeTrack?.id === track.id
        const isLiked = likedTracks[track.id] ?? Boolean(track.is_liked || track.liked)
        const selectTrack = () => onTrackSelect(track)
        const toggleLike = () => setLikedTracks(previous => ({ ...previous, [track.id]: !isLiked }))
        return (
            <li
                className={`track-list__item${isActive ? ' track-list__item--active' : ''}`}
                key={track.id ?? `${track.title}-${index}`}
            >
                <button
                    className="track-list__select"
                    type="button"
                    onClick={selectTrack}
                    aria-current={isActive ? 'true' : undefined}
                >
                    <span className="track-list__index">{index + 1}</span>
                    <Cover cover={getTrackCover(track)} />
                    <span className="track-list__meta">
                        <strong>{track.title || 'Без названия'}</strong>
                        <small>{getArtistName(track)}</small>
                    </span>
                    <span className="track-list__duration">
                        {formatDuration(track.duration ?? track.duration_seconds ?? (track.duration_ms ?? 0) / 1000)}
                    </span>
                </button>
                <button
                    className="track-list__like"
                    type="button"
                    aria-label={`${isLiked ? 'Убрать из' : 'Добавить в'} избранное: ${track.title}`}
                    aria-pressed={isLiked ? 'true' : 'false'}
                    onClick={toggleLike}
                >
                    <Icon name="heart" size={19} />
                </button>
                <Icon name="more" size={20} className="track-list__more" />
            </li>
        )
    }
    return (
        <ol className="track-list" aria-label="Популярные треки">
            {tracks.slice(0, 6).map(renderTrack)}
        </ol>
    )
}
const CollectionSection = ({ title, items, type, tracksStatus }: CollectionProps) => {
    const emptyMessage = () => {
        if (tracksStatus === 'loading') return 'Загружаем…'
        if (tracksStatus === 'error') return 'Не удалось загрузить данные.'
        return type === 'artist' ? 'Пока нет исполнителей.' : 'Пока нет альбомов.'
    }
    const renderCard = (item: CollectionItem) => (
        <article className="music-collection__card" key={item.id}>
            <Cover
                cover={type === 'artist' ? item.image_url : item.cover_url}
                icon={type === 'artist' ? 'artist' : 'music'}
            />
            <strong>{type === 'artist' ? item.name : item.title}</strong>
        </article>
    )
    return (
        <section className="music-collection" aria-label={title}>
            <div className="music-collection__heading">
                <h2>{title}</h2>
                {items.length > 0 && (
                    <button type="button">
                        Смотреть все <Icon name="chevronRight" size={16} />
                    </button>
                )}
            </div>
            {items.length === 0 && <p className="music-collection__empty">{emptyMessage()}</p>}
            <div className={`music-collection__list music-collection__list--${type}`}>
                {items.slice(0, 4).map(renderCard)}
            </div>
        </section>
    )
}
export const HomePage = ({
    tracks = [],
    artists = [],
    albums = [],
    activeTrack,
    onTrackSelect = () => {},
    tracksStatus = 'ready',
    tracksError = '',
    onTracksRetry = () => {},
}: HomePageProps) => {
    const playPlaylist = () => {
        const track = tracks[0]
        if (track) onTrackSelect(track)
    }
    return (
        <div className="home-page">
            <header className="home-page__header">
                <h1>Главная</h1>
            </header>

            <section className="featured-playlist" aria-labelledby="featured-title">
                <div>
                    <h2 id="featured-title">Плейлист для тебя</h2>
                    <p>
                        Треки, которые всегда с тобой.
                        <br />
                        Собрано на основе твоих прослушиваний.
                    </p>
                    <button type="button" onClick={playPlaylist} disabled={!tracks.length}>
                        <Icon name="play" size={16} /> Слушать
                    </button>
                </div>
            </section>

            <section className="home-page__popular" aria-labelledby="popular-title">
                <h2 id="popular-title">Популярные треки</h2>
                <TrackList
                    tracks={tracks}
                    activeTrack={activeTrack}
                    onTrackSelect={onTrackSelect}
                    tracksStatus={tracksStatus}
                    tracksError={tracksError}
                    onTracksRetry={onTracksRetry}
                />
            </section>

            <div className="home-page__collections">
                <CollectionSection title="Исполнители" items={artists} type="artist" tracksStatus={tracksStatus} />
                <CollectionSection title="Альбомы" items={albums} type="album" tracksStatus={tracksStatus} />
            </div>
        </div>
    )
}
