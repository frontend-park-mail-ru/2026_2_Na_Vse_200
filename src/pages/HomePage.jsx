import { createElement, useState } from '../../index.js'
import { Icon } from '../components/ui/Icon.jsx'
import { getArtistName, getTrackCover } from '../features/music/presentation.js'
import './HomePage.css'

const mixes = [
    { name: 'Тихое утро', detail: 'Мягкий старт дня', color: '#62739e', icon: 'sun' },
    { name: 'На повторе', detail: 'Твои любимые треки', color: '#a36d78', icon: 'repeat' },
    { name: 'Ночная смена', detail: 'Звуки после заката', color: '#685a9d', icon: 'moon' },
    { name: 'Новый ритм', detail: 'Свежие находки недели', color: '#568b82', icon: 'sparkle' },
]

const coverIcons = ['music', 'sun', 'sparkle', 'moon', 'artist']

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainder = String(seconds % 60).padStart(2, '0')
    return `${minutes}:${remainder}`
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
            <p className="home-message" aria-live="polite">
                Загружаем треки…
            </p>
        )
    }

                    return (
                        <li className="track-list-item" key={track.id}>
                            <button
                                className={`track-row${isActive ? ' is-active' : ''}`}
                                type="button"
                                onClick={() => onTrackSelect(track)}
                                aria-current={isActive ? 'true' : undefined}
                            >
                                <span className="track-index">
                                    {isActive ? (
                                        <Icon
                                            name="music"
                                            size={17}
                                            className="track-playing-icon"
                                            label="Сейчас выбрано"
                                        />
                                    ) : (
                                        String(index + 1).padStart(2, '0')
                                    )}
                                </span>
                                <span className={`track-cover cover-tone-${index + 1}`}>
                                    <Icon name={coverIcons[index]} size={22} />
                                </span>
                                <span className="track-meta">
                                    <strong>{track.title}</strong>
                                    <small>{track.artist}</small>
                                </span>
                                <span className="track-album">{track.album}</span>
                                <span className="track-duration">{formatDuration(track.durationSec || 0)}</span>
                                <Icon name="more" size={20} className="track-more" />
                            </button>
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}

function ArtistList({ artists = []}) {
    return (
        <section className="collection-section" aria-label={title}>
            <div className="collection-heading">
                <h2>{title}</h2>
                {items.length > 0 && (
                    <button type="button">
                        Смотреть все <Icon name="chevronRight" size={16} />
                    </button>
                )}
            </div>
            <div className="artist-list">
                {artists.map((artist, index) => (
                    <article className="artist-card" key={artist.id || artist.name}>
                        <span className={`artist-avatar artist-avatar-${(index % 4) + 1}`}>
                            <Icon name="artist" size={25} />
                        </span>
                        <strong className="artist-name">{artist.name}</strong>
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
            <header className="home-header">
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
                ))}
            </div>
        </section>
    )
}

export function HomePage({
    tracks = [],
    artists = [],
    activeTrack = tracks[0],
    onTrackSelect = () => {},
}) {
    const [activeMix, setActiveMix] = useState(0)
    return (
        <div className="home-page">
            <PageHeader />
            <div className="home-page-divider"></div>
            {tracks.length === 0 ? (
                <p>Пока нет треков</p>
            ) : (
                <TrackList tracks={tracks} activeTrack={activeTrack} onTrackSelect={onTrackSelect} />
            )}
            <section className="home-section discovery-section" aria-labelledby="discovery-title">
                <div className="discovery-grid">
                    <ArtistList artists={artists} />
                    <MixList activeMix={activeMix} onMixSelect={setActiveMix} />
                </div>
            </section>

            <section className="popular-section" aria-labelledby="popular-title">
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

            <div className="home-collections">
                <CollectionSection title="Исполнители" items={artists} type="artist" tracksStatus={tracksStatus} />
                <CollectionSection title="Альбомы" items={albums} type="album" tracksStatus={tracksStatus} />
            </div>
        </div>
    )
}
