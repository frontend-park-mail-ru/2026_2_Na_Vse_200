import { createElement, useState } from '@navse200/my-react'
import { Icon } from '../ui/Icon.jsx'
import { getArtistName, getTrackCover } from '../../features/music/presentation.js'
import previousIcon from '../../assets/artist/figma/previous.svg'
import nextIcon from '../../assets/artist/figma/next.svg'
import pauseIcon from '../../assets/artist/figma/pause.svg'
import heartIcon from '../../assets/artist/figma/heart-exact.svg'
import dislikeIcon from '../../assets/artist/figma/dislike.svg'
import volumeIcon from '../../assets/artist/figma/volume-exact.svg'
import './Player.css'
import type { AudioPlayer, PlaybackState } from '../../shared/audio/player.ts'
import { connectionAvailable } from '../../shared/offline/network.ts'

interface PlayerTrack {
    id: string | number
    title?: string
    duration?: number
    duration_ms?: number
    is_liked?: boolean
    liked?: boolean
}

interface Props {
    player?: AudioPlayer
    className?: string
    queueOpen?: boolean
    onQueueToggle?: () => void
    onQueueClose?: () => void
    track?: PlayerTrack
    tracks?: PlayerTrack[]
    onTrackSelect?: (track: PlayerTrack) => void
}

function formatTime(seconds: number) {
    const total = Math.max(0, Math.floor(seconds))
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function PlayerTimeline({ playback, player }: { playback: PlaybackState; player?: AudioPlayer }) {
    const { duration, currentTime, available } = playback
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className="player__timeline">
            <span className="player__time" aria-label="Прошло времени">
                {formatTime(currentTime)}
            </span>
            <input
                className="player__seek"
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                disabled={!available || duration <= 0}
                aria-label="Позиция воспроизведения"
                style={{
                    background: `linear-gradient(to right, #9f9ac0 ${progress}%, #827676 ${progress}%)`,
                }}
                onInput={(event: Event) =>
                    player?.seek((Number((event.currentTarget as HTMLInputElement).value) / 100) * duration)
                }
            />
            <span className="player__time">{formatTime(duration)}</span>
        </div>
    )
}

export function Player({
    player,
    className = '',
    track,
    tracks = [],
    onTrackSelect = () => {},
    queueOpen = false,
    onQueueToggle,
    onQueueClose,
}: Props) {
    const playback = player?.getState() ?? {
        available: false,
        playing: false,
        loading: false,
        currentTime: 0,
        duration: 0,
        volume: 0.6136,
        muted: false,
        error: '',
    }
    const { playing: isPlaying, muted } = playback
    const volume = muted ? 0 : Math.round(playback.volume * 10000) / 100
    const [failedCover, setFailedCover] = useState('')
    const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({})
    const [dislikedTracks, setDislikedTracks] = useState<Record<string, boolean>>({})
    const cover = getTrackCover(track)
    const isLiked = track ? (likedTracks[track.id] ?? Boolean(track.is_liked || track.liked)) : false
    const isDisliked = track ? Boolean(dislikedTracks[track.id]) : false

    function selectAdjacent(offset: number) {
        if (!tracks.length) return
        const index = tracks.findIndex(item => item.id === track?.id)
        onTrackSelect(tracks[(Math.max(0, index) + offset + tracks.length) % tracks.length])
    }

    function toggleLike() {
        if (!track) return
        setLikedTracks(previous => ({ ...previous, [track.id]: !isLiked }))
        if (!isLiked) setDislikedTracks(previous => ({ ...previous, [track.id]: false }))
    }

    function toggleDislike() {
        if (!track) return
        setDislikedTracks(previous => ({ ...previous, [track.id]: !isDisliked }))
        if (!isDisliked) setLikedTracks(previous => ({ ...previous, [track.id]: false }))
    }

    return (
        <footer className={`player ${className}`} aria-label="Музыкальный плеер">
            <div className="player__body">
                <div className="player__left">
                    <div className="player__track">
                        <span className="player__cover">
                            {cover && failedCover !== cover ? (
                                <img
                                    className="player__image player__cover-image"
                                    src={cover}
                                    alt=""
                                    onError={() => setFailedCover(cover)}
                                />
                            ) : (
                                <Icon name="music" size={22} label={undefined} />
                            )}
                        </span>
                        <span className="player__track-copy">
                            <strong className="player__title">{track?.title || 'Выберите трек'}</strong>
                            <small className="player__artists">
                                {track ? getArtistName(track) : 'Популярные треки'}
                            </small>
                        </span>
                    </div>
                </div>
                <div className="player__center">
                    <div className="player__controls">
                        <button
                            className="player__button player__control player__control--previous"
                            type="button"
                            aria-label="Предыдущий трек"
                            disabled={!track}
                            onClick={() => selectAdjacent(-1)}
                        >
                            <img
                                className="player__image player__control-image player__control-image--previous"
                                src={previousIcon}
                                alt=""
                            />
                        </button>
                        <button
                            className="player__button player__control player__control--play"
                            type="button"
                            aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                            disabled={!playback.available}
                            onClick={() => (isPlaying || playback.loading ? player?.pause() : void player?.play())}
                        >
                            {isPlaying ? (
                                <img className="player__image player__pause-image" src={pauseIcon} alt="" />
                            ) : (
                                <Icon className="player__play-icon" name="play" size={30} label={undefined} />
                            )}
                        </button>
                        <button
                            className="player__button player__control player__control--next"
                            type="button"
                            aria-label="Следующий трек"
                            disabled={!track}
                            onClick={() => selectAdjacent(1)}
                        >
                            <img
                                className="player__image player__control-image player__control-image--next"
                                src={nextIcon}
                                alt=""
                            />
                        </button>
                    </div>
                    <div className="player__progress">
                        <button
                            className={`player__button player__tool player__dislike${isDisliked ? ' player__dislike--active' : ''}`}
                            type="button"
                            aria-label="Не нравится"
                            aria-pressed={isDisliked ? 'true' : 'false'}
                            disabled={!track}
                            onClick={toggleDislike}
                        >
                            <img className="player__image player__reaction-image" src={dislikeIcon} alt="" />
                        </button>
                        <PlayerTimeline playback={playback} player={player} />
                        <button
                            className={`player__button player__like${isLiked ? '' : ' player__like--inactive'}`}
                            type="button"
                            aria-label={isLiked ? 'Убрать трек из избранного' : 'Добавить трек в избранное'}
                            aria-pressed={isLiked ? 'true' : 'false'}
                            disabled={!track}
                            onClick={toggleLike}
                        >
                            <img className="player__image player__reaction-image" src={heartIcon} alt="" />
                        </button>
                    </div>
                    <p className="player__status" role="status">
                        {playback.error ||
                            (playback.loading
                                ? connectionAvailable()
                                    ? 'Ожидаем аудио…'
                                    : 'Буфер закончился. Подключитесь к интернету для продолжения.'
                                : !playback.available
                                  ? 'Для трека пока нет аудиофайла.'
                                  : '')}
                    </p>
                </div>
                <div className="player__extra">
                    <button
                        className={`player__button player__queue-button${queueOpen ? ' player__queue-button--open' : ''}`}
                        type="button"
                        aria-label="Открыть очередь"
                        aria-expanded={queueOpen ? 'true' : 'false'}
                        aria-controls="player-queue"
                        onClick={onQueueToggle}
                    >
                        <Icon className="player__queue-icon" name="queue" size={30} label={undefined} />
                    </button>
                    <div className="player__volume-control">
                        <button
                            className={`player__button player__mute${muted ? ' player__mute--active' : ''}`}
                            type="button"
                            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
                            aria-pressed={muted ? 'true' : 'false'}
                            onClick={() => player?.toggleMute()}
                        >
                            <img className="player__image player__volume-image" src={volumeIcon} alt="" />
                        </button>
                        <input
                            className="player__volume"
                            type="range"
                            min="0"
                            max="100"
                            step="0.01"
                            value={volume}
                            aria-label="Громкость"
                            onInput={(event: Event) =>
                                player?.setVolume(Number((event.currentTarget as HTMLInputElement).value) / 100)
                            }
                            style={{ background: `linear-gradient(to right, #9f9ac0 ${volume}%, #fff ${volume}%)` }}
                        />
                    </div>
                </div>
                {queueOpen && (
                    <section
                        className="player__panel player__queue-panel"
                        id="player-queue"
                        aria-label="Очередь воспроизведения"
                    >
                        <h2 className="player__panel-title">Очередь</h2>
                        {tracks.length ? (
                            <ol className="player__queue-list">
                                {tracks.map(item => (
                                    <li key={item.id}>
                                        <button
                                            className={`player__button player__queue-track${item.id === track?.id ? ' player__queue-track--current' : ''}`}
                                            type="button"
                                            aria-current={item.id === track?.id ? 'true' : undefined}
                                            onClick={() => {
                                                onTrackSelect(item)
                                                onQueueClose?.()
                                            }}
                                        >
                                            {item.title || 'Без названия'}
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p>Очередь пока пуста.</p>
                        )}
                    </section>
                )}
            </div>
        </footer>
    )
}
