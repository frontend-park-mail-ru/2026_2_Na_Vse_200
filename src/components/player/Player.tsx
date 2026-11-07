import { formatTime, getAudioUrl } from '../../features/music/player.ts'
import type { AudioPlayer } from '../../features/music/player.ts'
import type { Track } from '../../types/domain.ts'
interface PlayerProps {
    player: AudioPlayer
    onLocalFile: (file: File) => void
    track?: Track
    tracks?: Track[]
    onTrackSelect?: (track: Track) => void
}
import { createElement, useState } from '../../../myReact/index.ts'
import { Icon } from '../ui/Icon.tsx'
import { getArtistName, getTrackCover } from '../../features/music/presentation.ts'
import './Player.css'

export function Player(props: PlayerProps) {
    const { player, track, tracks = [], onTrackSelect = () => {} } = props
    const playback = player.getState()
    const { playing: isPlaying, duration, currentTime, available, loading, error, muted } = playback
    const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
    const volume = playback.volume * 100
    const visibleVolume = muted ? 0 : volume
    const playable = tracks.filter(item => getAudioUrl(item))
    const [failedCover, setFailedCover] = useState('')
    const cover = getTrackCover(track)
    const selectAdjacent = (offset: number) => {
        if (!playable.length) return
        const index = playable.findIndex(item => item.id === track?.id)
        const nextIndex =
            index < 0 ? (offset > 0 ? 0 : playable.length - 1) : (index + offset + playable.length) % playable.length
        onTrackSelect(playable[nextIndex])
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
                        disabled={!playable.length}
                        onClick={() => selectAdjacent(-1)}
                    >
                        <Icon name="trackPrevious" size={25} />
                    </button>
                    <button
                        type="button"
                        className="player-control player__play-toggle"
                        aria-label={isPlaying || loading ? 'Пауза' : 'Воспроизвести'}
                        disabled={!available}
                        onClick={() => (isPlaying || loading ? player.pause() : void player.play())}
                    >
                        <Icon name={isPlaying ? 'pause' : 'play'} size={25} />
                    </button>
                    <button
                        type="button"
                        className="player-control player__secondary-control"
                        aria-label="Следующий трек"
                        disabled={!playable.length}
                        onClick={() => selectAdjacent(1)}
                    >
                        <Icon name="trackNext" size={25} />
                    </button>
                </div>

                <div className="player-timeline">
                    <span className="player-time">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        disabled={!available || duration <= 0}
                        style={timelineStyle}
                        aria-label="Позиция воспроизведения"
                        onInput={event => {
                            if (event.currentTarget instanceof HTMLInputElement)
                                player.seek((Number(event.currentTarget.value) / 100) * duration)
                        }}
                    />
                    <span className="player-time">{formatTime(duration)}</span>
                </div>
                <p className="player-status" role="status">
                    {error ||
                        (loading
                            ? 'Загружаем аудио…'
                            : !available
                              ? 'Для трека пока нет аудиофайла.'
                              : '')}
                </p>
                {/* Локальный выбор файла временно отключён.
                <label className="player-file">
                    Открыть MP3
                    <input
                        type="file"
                        accept="audio/mpeg,.mp3"
                        onChange={event => {
                            if (!(event.currentTarget instanceof HTMLInputElement)) return
                            const file = event.currentTarget.files?.[0]
                            if (file) props.onLocalFile(file)
                            event.currentTarget.value = ''
                        }}
                    />
                </label>
                */}
            </div>

            <div className="player-extra">
                <button
                    type="button"
                    aria-label={muted ? 'Включить звук' : 'Выключить звук'}
                    aria-pressed={muted ? 'true' : 'false'}
                    onClick={() => player.toggleMute()}
                >
                    <Icon name="volume" size={22} />
                </button>
                <input
                    className="player-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={visibleVolume}
                    aria-label="Громкость"
                    onInput={event => {
                        if (event.currentTarget instanceof HTMLInputElement)
                            player.setVolume(Number(event.currentTarget.value) / 100)
                    }}
                    style={{
                        background: `linear-gradient(to right, #afa3ca ${visibleVolume}%, #f1eff5 ${visibleVolume}%)`,
                    }}
                />
            </div>
        </footer>
    )
}
