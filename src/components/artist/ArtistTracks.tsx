import './ArtistTracks.css'
import { createElement, useState } from '@navse200/my-react'
import heartIcon from '../../assets/artist/figma/heart-exact.svg'
import moreIcon from '../../assets/artist/figma/track-more.svg'
import { ArtistCover } from './ArtistCover.tsx'
import type { ArtistTrack } from '../../features/artist/types.ts'

interface Props {
    tracks: ArtistTrack[]
    activeTrack?: { id: string | number }
    onTrackSelect: (track: ArtistTrack) => void
}

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export function ArtistTracks({ tracks, activeTrack, onTrackSelect }: Props) {
    const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({})
    const [menuTrack, setMenuTrack] = useState('')

    function toggleLike(track: ArtistTrack) {
        const liked = likedTracks[track.id] ?? track.is_liked
        setLikedTracks(previous => ({ ...previous, [track.id]: !liked }))
    }

    if (!tracks.length) return <p className="artist-tracks__empty">У исполнителя пока нет треков.</p>

    return (
        <ol className="artist-tracks" aria-label="Популярные треки">
            {tracks.map((track, index) => {
                const liked = likedTracks[track.id] ?? track.is_liked

                return (
                    <li className="artist-tracks__item" key={track.id}>
                        <button
                            className="artist-tracks__select"
                            type="button"
                            onClick={() => onTrackSelect(track)}
                            aria-label={`Слушать ${track.title}`}
                            aria-current={activeTrack?.id === track.id ? 'true' : undefined}
                        >
                            <span className="artist-tracks__number">{index + 1}</span>
                            <ArtistCover className="artist-tracks__cover" src={track.cover_url} name="" />
                            <span className="artist-tracks__copy">
                                <strong className="artist-tracks__title">{track.title}</strong>
                                <small className="artist-tracks__artists">{track.artists.join(', ')}</small>
                            </span>
                            <span className="artist-tracks__duration">{formatDuration(track.duration)}</span>
                        </button>
                        <button
                            className="artist-tracks__like"
                            type="button"
                            aria-label={`${liked ? 'Убрать из' : 'Добавить в'} избранное: ${track.title}`}
                            aria-pressed={liked ? 'true' : 'false'}
                            onClick={() => toggleLike(track)}
                        >
                            <img
                                className={`artist-tracks__like-icon${liked ? '' : ' artist-tracks__like-icon--unliked'}`}
                                src={heartIcon}
                                alt=""
                            />
                        </button>
                        <button
                            className="artist-tracks__more"
                            type="button"
                            aria-label={`Действия с треком ${track.title}`}
                            aria-expanded={menuTrack === track.id ? 'true' : 'false'}
                            onClick={() => setMenuTrack(menuTrack === track.id ? '' : track.id)}
                        >
                            <img src={moreIcon} alt="" />
                        </button>
                        {menuTrack === track.id && (
                            <div className="artist-tracks__menu">
                                <button
                                    className="artist-tracks__menu-button"
                                    type="button"
                                    onClick={() => {
                                        onTrackSelect(track)
                                        setMenuTrack('')
                                    }}
                                >
                                    Слушать
                                </button>
                                <button
                                    className="artist-tracks__menu-button"
                                    type="button"
                                    onClick={() => {
                                        toggleLike(track)
                                        setMenuTrack('')
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
