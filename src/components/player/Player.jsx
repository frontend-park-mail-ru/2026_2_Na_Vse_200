import { createElement, useState } from '../../shared/lib/my-react/index.js'
import { Icon } from '../ui/Icon.jsx'
import { getArtistName, getTrackCover } from '../../features/music/presentation.js'
import './Player.css'

export function Player({ track, tracks = [], onTrackSelect = () => {} }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(32)
    const [volume, setVolume] = useState(62)
    const [failedCover, setFailedCover] = useState('')
    const cover = getTrackCover(track)
    const selectAdjacent = offset => {
        if (!tracks.length) return
        const index = tracks.findIndex(item => item.id === track?.id)
        onTrackSelect(tracks[(Math.max(0, index) + offset + tracks.length) % tracks.length])
    }
    const timelineStyle = {
        background: `linear-gradient(90deg, #bba4ff 0%, #bba4ff ${progress}%, #494956 ${progress}%, #494956 100%)`,
    }

    return (
        <footer className="player" aria-label="Музыкальный плеер">
            <div className="player-track">
                <span className="player-cover">
                    {cover && failedCover !== cover ? (
                        <img src={cover} alt="" onError={() => setFailedCover(cover)} />
                    ) : (
                        <Icon name="music" size={22} />
                    )}
                </span>
                <span className="player-track-copy">
                    <strong>{track?.title || 'Выберите трек'}</strong>
                    <small>{track ? getArtistName(track) : 'Популярные треки'}</small>
                </span>
            </div>

            <div className="player-center">
                <div className="player-controls">
                    <button
                        type="button"
                        className="player-control player__secondary-control"
                        aria-label="Предыдущий трек"
                        disabled={!track}
                        onClick={() => selectAdjacent(-1)}
                    >
                        <Icon name="trackPrevious" size={25} />
                    </button>
                    <button
                        type="button"
                        className="player-control player__play-toggle"
                        aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                        disabled={!track}
                        onClick={() => setIsPlaying(!isPlaying)}
                    >
                        <Icon name={isPlaying ? 'pause' : 'play'} size={25} />
                    </button>
                    <button
                        type="button"
                        className="player-control player__secondary-control"
                        aria-label="Следующий трек"
                        disabled={!track}
                        onClick={() => selectAdjacent(1)}
                    >
                        <Icon name="trackNext" size={25} />
                    </button>
                </div>

                <div className="player-timeline">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        disabled={!track}
                        style={timelineStyle}
                        aria-label="Позиция воспроизведения"
                        onInput={event => setProgress(Number(event.target.value))}
                    />
                </div>
            </div>

            <div className="player-extra">
                <button type="button" aria-label="Открыть очередь">
                    <Icon name="queue" size={24} />
                </button>
                <Icon name="volume" size={22} />
                <input
                    className="player-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    aria-label="Громкость"
                    onInput={event => setVolume(Number(event.target.value))}
                    style={{ background: `linear-gradient(to right, #afa3ca ${volume}%, #f1eff5 ${volume}%)` }}
                />
            </div>
        </footer>
    )
}
