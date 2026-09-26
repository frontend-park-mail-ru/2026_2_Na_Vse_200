"use strict";

import { createElement, useState } from "../../../index.js"
import { Icon } from "../../components/ui/Icon.jsx"
import "./Player.css"

export function Player({ track = { title: "Midnight Drive", artist: "Neon Waves" } }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(32)
    const timelineStyle = {
        background: `linear-gradient(90deg, #bba4ff 0%, #bba4ff ${progress}%, #494956 ${progress}%, #494956 100%)`
    }

    return <footer className="player" aria-label="Музыкальный плеер">
        <div className="player-track">
            <span className="player-cover"><Icon name="music" size={22} /></span>
            <span className="player-track-copy">
                <strong>{track.title}</strong>
                <small>{track.artist}</small>
            </span>
            <button className="player-like" type="button" aria-label="Добавить в избранное">
                <Icon name="heart" size={19} />
            </button>
        </div>

        <div className="player-center">
            <div className="player-controls">
                <button type="button" className="player-control secondary-control" aria-label="Предыдущий трек">
                    <Icon name="previous" size={17} />
                </button>
                <button
                    type="button"
                    className="player-control play-toggle"
                    aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
                    onClick={() => setIsPlaying(!isPlaying)}
                >
                    <Icon name={isPlaying ? "pause" : "play"} size={17} />
                </button>
                <button type="button" className="player-control secondary-control" aria-label="Следующий трек">
                    <Icon name="next" size={17} />
                </button>
            </div>

            <div className="player-timeline">
                <span>1:04</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    style={timelineStyle}
                    aria-label="Позиция воспроизведения"
                    onInput={event => setProgress(Number(event.target.value))}
                />
                <span>3:42</span>
            </div>
        </div>

        <div className="player-extra">
            <Icon name="volume" size={18} />
            <div className="volume-track"><i></i></div>
            <button type="button" aria-label="Открыть очередь"><Icon name="queue" size={19} /></button>
        </div>
    </footer>
}
