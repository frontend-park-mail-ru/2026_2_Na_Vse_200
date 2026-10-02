'use strict'

import { createElement, useState } from '../../index.js'
import { Icon } from '../components/ui/Icon.jsx'
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

function PageHeader() {
    return (
        <header className="home-header">
            <div>
                <h1>Главная</h1>
            </div>
            <button className="profile-button" type="button" aria-label="Профиль">
                А
            </button>
        </header>
    )
}

function TrackList({ tracks, activeTrack, onTrackSelect }) {
    return (
        <section className="home-section" aria-labelledby="popular-title">
            <ol className="track-list" aria-label="Популярные треки">
                {tracks.slice(0, 5).map((track, index) => {
                    const isActive = activeTrack.id === track.id

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
        <section className="discovery-panel" aria-labelledby="artists-title">
            <div className="main-page__subsection-heading">
                <h3 id="artists-title">Артисты</h3>
                <button className="main-page__text-button" type="button">
                    Все{' '}
                </button>
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

function MixList({ activeMix, onMixSelect }) {
    return (
        <section className="discovery-panel" aria-labelledby="mixes-title">
            <div className="main-page__subsection-heading">
                <h3 id="mixes-title">Подборки</h3>
                <button className="main-page__text-button" type="button">
                    Все{' '}
                </button>
            </div>
            <div className="mix-list">
                {mixes.map((mix, index) => (
                    <button
                        className={`mix-card${activeMix === index ? ' is-selected' : ''}`}
                        type="button"
                        key={mix.name}
                        onClick={() => onMixSelect(index)}
                    >
                        <span className={`mix-art mix-art-${index + 1}`} style={{ backgroundColor: mix.color }}>
                            <Icon name={mix.icon} size={25} />
                        </span>
                        <span className="mix-copy">
                            <strong>{mix.name}</strong>
                            <small>{mix.detail}</small>
                        </span>
                        <Icon name="play" size={13} className="mix-play" />
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
        </div>
    )
}
