import { createElement, useState } from '../shared/lib/my-react/index.js'
import { Icon } from '../components/ui/Icon.jsx'
import { getArtistName, getTrackCover } from '../features/music/presentation.js'
import './HomePage.css'

function formatDuration(duration) {
    if (typeof duration === 'string' && /^\d+:\d{2}$/.test(duration)) return duration
    const seconds = Number(duration?.seconds ?? duration?.duration_seconds ?? duration ?? 0)
    if (!Number.isFinite(seconds) || seconds <= 0) return '—:——'
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

function Cover({ cover, className = '', icon = 'music' }) {
    const [failedCover, setFailedCover] = useState('')
    return (
        <span className={`music-cover ${className}`}>
            {cover && failedCover !== cover ? (
                <img src={cover} alt="" loading="lazy" onError={() => setFailedCover(cover)} />
            ) : (
                <Icon name={icon} size={20} />
            )}
        </span>
    )
}

function TrackList({ tracks, activeTrack, onTrackSelect, tracksStatus, tracksError, onTracksRetry }) {
    const [likedTracks, setLikedTracks] = useState({})
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

    return (
        <ol className="track-list" aria-label="Популярные треки">
            {tracks.slice(0, 6).map((track, index) => {
                const isActive = activeTrack?.id === track.id
                const isLiked = likedTracks[track.id] ?? Boolean(track.is_liked || track.liked)
                return (
                    <li
                        className={`track-list__item${isActive ? ' track-list__item--active' : ''}`}
                        key={track.id ?? `${track.title}-${index}`}
                    >
                        <button
                            className="track-list__select"
                            type="button"
                            onClick={() => onTrackSelect(track)}
                            aria-current={isActive ? 'true' : undefined}
                        >
                            <span className="track-list__index">{index + 1}</span>
                            <Cover cover={getTrackCover(track)} />
                            <span className="track-list__meta">
                                <strong>{track.title || 'Без названия'}</strong>
                                <small>{getArtistName(track)}</small>
                            </span>
                            <span className="track-list__duration">
                                {formatDuration(track.duration ?? track.duration_seconds ?? track.duration_ms / 1000)}
                            </span>
                        </button>
                        <button
                            className="track-list__like"
                            type="button"
                            aria-label={`${isLiked ? 'Убрать из' : 'Добавить в'} избранное: ${track.title}`}
                            aria-pressed={isLiked ? 'true' : 'false'}
                            onClick={() => setLikedTracks(previous => ({ ...previous, [track.id]: !isLiked }))}
                        >
                            <Icon name="heart" size={19} />
                        </button>
                        <Icon name="more" size={20} className="track-list__more" />
                    </li>
                )
            })}
        </ol>
    )
}

function CollectionSection({ title, items, type, tracksStatus }) {
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
            {items.length === 0 && (
                <p className="music-collection__empty">
                    {tracksStatus === 'loading'
                        ? 'Загружаем…'
                        : tracksStatus === 'error'
                          ? 'Не удалось загрузить данные.'
                          : type === 'artist'
                            ? 'Пока нет исполнителей.'
                            : 'Пока нет альбомов.'}
                </p>
            )}
            <div className={`music-collection__list music-collection__list--${type}`}>
                {items.slice(0, 4).map(item => (
                    <article className="music-collection__card" key={item.id}>
                        <Cover
                            cover={type === 'artist' ? item.image_url : item.cover_url}
                            icon={type === 'artist' ? 'artist' : 'music'}
                        />
                        <strong>{type === 'artist' ? item.name : item.title}</strong>
                    </article>
                ))}
            </div>
        </section>
    )
}

export function HomePage({
    tracks = [],
    artists = [],
    albums = [],
    activeTrack,
    onTrackSelect = () => {},
    tracksStatus = 'ready',
    tracksError = '',
    onTracksRetry = () => {},
}) {
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
                    <button
                        type="button"
                        onClick={() => tracks[0] && onTrackSelect(tracks[0])}
                        disabled={!tracks.length}
                    >
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
