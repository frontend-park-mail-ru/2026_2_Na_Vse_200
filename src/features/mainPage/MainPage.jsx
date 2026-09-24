"use strict";

import { createElement, useState } from "../../../MyReact/index.js"
import { Icon } from "../../components/ui/Icon.jsx"
import tracks from "./tracks.json"
import "./MainPage.css"

const artists = [
    { name: "Mira Sol", style: "Инди-поп", color: "#ef9b75" },
    { name: "The Weekenders", style: "Альтернативный рок", color: "#8ca4ed" },
    { name: "Luna Park", style: "Электроника", color: "#c78ce8" },
    { name: "Northbound", style: "Инди-фолк", color: "#88c6ad" }
]

const mixes = [
    { name: "Тихое утро", detail: "Мягкий старт дня", color: "#62739e", icon: "sun" },
    { name: "На повторе", detail: "Твои любимые треки", color: "#a36d78", icon: "repeat" },
    { name: "Ночная смена", detail: "Звуки после заката", color: "#685a9d", icon: "moon" },
    { name: "Новый ритм", detail: "Свежие находки недели", color: "#568b82", icon: "sparkle" }
]

const coverIcons = ["music", "sun", "sparkle", "moon", "artist"]

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainder = String(seconds % 60).padStart(2, "0")
    return `${minutes}:${remainder}`
}

function PageHeader() {
    return <header className="home-header">
        <div>
            <p className="home-eyebrow">ТВОЯ МУЗЫКА, ТВОЙ РИТМ</p>
            <h1>Главная</h1>
        </div>
        <button className="profile-button" type="button" aria-label="Профиль">А</button>
    </header>
}

function SectionHeading({ eyebrow, title, id }) {
    return <div className="section-heading">
        <div>
            <p className="section-kicker">{eyebrow}</p>
            <h2 id={id}>{title}</h2>
        </div>
    </div>
}

function TrackList({ activeTrack, onTrackSelect }) {
    return <section className="home-section" aria-labelledby="popular-title">
        <SectionHeading id="popular-title" eyebrow="СЕГОДНЯ ДЛЯ ТЕБЯ" title="Популярные треки" />
        <ol className="track-list" aria-label="Популярные треки">
            {tracks.slice(0, 5).map((track, index) => {
                const isActive = activeTrack.id === track.id

                return <li className="track-list-item" key={track.id}>
                    <button
                        className={`track-row${isActive ? " is-active" : ""}`}
                        type="button"
                        onClick={() => onTrackSelect(track)}
                        aria-current={isActive ? "true" : undefined}
                    >
                        <span className="track-index">
                            {isActive
                                ? <Icon name="music" size={17} className="track-playing-icon" label="Сейчас выбрано" />
                                : String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={`track-cover cover-tone-${index + 1}`}>
                            <Icon name={coverIcons[index]} size={22} />
                        </span>
                        <span className="track-meta">
                            <strong>{track.title}</strong>
                            <small>{track.artist}</small>
                        </span>
                        <span className="track-album">{track.album}</span>
                        <span className="track-duration">{formatDuration(178 + index * 23)}</span>
                        <Icon name="more" size={20} className="track-more" />
                    </button>
                </li>
            })}
        </ol>
    </section>
}

function ArtistList() {
    return <section className="discovery-panel" aria-labelledby="artists-title">
        <div className="subsection-heading">
            <h3 id="artists-title">Артисты</h3>
            <button className="text-button" type="button">Все <Icon name="arrowRight" size={14} /></button>
        </div>
        <div className="artist-list">
            {artists.map((artist, index) => <article className="artist-card" key={artist.name}>
                <span className={`artist-avatar artist-avatar-${index + 1}`} style={{ backgroundColor: artist.color }}>
                    <Icon name="artist" size={25} />
                </span>
                <strong className="artist-name">{artist.name}</strong>
                <span className="artist-style">{artist.style}</span>
            </article>)}
        </div>
    </section>
}

function MixList({ activeMix, onMixSelect }) {
    return <section className="discovery-panel" aria-labelledby="mixes-title">
        <div className="subsection-heading">
            <h3 id="mixes-title">Подборки</h3>
            <button className="text-button" type="button">Все <Icon name="arrowRight" size={14} /></button>
        </div>
        <div className="mix-list">
            {mixes.map((mix, index) => <button
                className={`mix-card${activeMix === index ? " is-selected" : ""}`}
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
            </button>)}
        </div>
    </section>
}

export function MainPage({ activeTrack = tracks[0], onTrackSelect = () => {} }) {
    const [activeMix, setActiveMix] = useState(0)

    return <div className="home-page">
        <PageHeader />
        <TrackList activeTrack={activeTrack} onTrackSelect={onTrackSelect} />
        <section className="home-section discovery-section" aria-labelledby="discovery-title">
            <SectionHeading id="discovery-title" eyebrow="ЛЮДИ И МУЗЫКА" title="Открой для себя" />
            <div className="discovery-grid">
                <ArtistList />
                <MixList activeMix={activeMix} onMixSelect={setActiveMix} />
            </div>
        </section>
    </div>
}