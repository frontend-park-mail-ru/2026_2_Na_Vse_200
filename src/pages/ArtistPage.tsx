import { createElement, useState } from '@navse200/my-react'
import chevron from '../assets/artist/figma/chevron.svg'
import chevronSmall from '../assets/artist/figma/chevron-small.svg'
import playIcon from '../assets/artist/figma/listen-play.svg'
import { ArtistCover } from '../components/artist/ArtistCover.tsx'
import { ArtistTracks } from '../components/artist/ArtistTracks.tsx'
import { ArtistAlbums } from '../components/artist/ArtistAlbums.tsx'
import type { ArtistPageProps } from '../features/artist/types.ts'
import './ArtistPage.css'

export function ArtistPage({
    artist,
    artistId,
    activeTrack,
    onTrackSelect,
    tracksStatus,
    tracksError,
    onTracksRetry,
    offline = false,
}: ArtistPageProps) {
    const [allTracks, setAllTracks] = useState(false)
    const [allAlbums, setAllAlbums] = useState(false)

    if (tracksStatus === 'loading' || tracksStatus === 'error') {
        return (
            <section className="artist-page artist-page--empty" aria-live="polite">
                {tracksStatus === 'loading' ? (
                    <p>Загружаем исполнителя…</p>
                ) : (
                    <div role="alert">
                        <p>{tracksError}</p>
                        <button type="button" onClick={onTracksRetry}>
                            Попробовать ещё раз
                        </button>
                    </div>
                )}
            </section>
        )
    }

    if (!artist || artistId !== artist.id) {
        return (
            <section className="artist-page artist-page--empty">
                <h1>{offline ? 'Этот исполнитель ещё не сохранён для оффлайна' : 'Исполнитель не найден'}</h1>
                <a className="artist-page__home-link" href="/" data-link>
                    На главную
                </a>
            </section>
        )
    }

    const tracks = allTracks ? artist.tracks : artist.tracks.slice(0, 5)
    const albums = allAlbums ? artist.albums : artist.albums.slice(0, 3)

    return (
        <div className="artist-page">
            <header className="artist-page__hero">
                <ArtistCover src={artist.image_url} name={artist.name} className="artist-page__photo" />
                <div className="artist-page__intro">
                    <h1 className="artist-page__title">{artist.name}</h1>
                    {artist.monthly_listeners !== undefined && (
                        <p className="artist-page__listeners">
                            {artist.monthly_listeners.toLocaleString('ru-RU')} слушателей в месяц
                        </p>
                    )}
                    <button
                        className="artist-page__listen"
                        type="button"
                        disabled={!artist.tracks.length}
                        onClick={() => onTrackSelect(artist.tracks[0])}
                    >
                        <img className="artist-page__listen-icon" src={playIcon} alt="" />
                        Слушать
                    </button>
                </div>
            </header>
            <div className="artist-page__columns">
                <section className="artist-page__tracks" aria-labelledby="artist-tracks-title">
                    <h2 className="artist-page__section-title" id="artist-tracks-title">
                        Популярные треки <img className="artist-page__section-icon" src={chevron} alt="" />
                    </h2>
                    <ArtistTracks tracks={tracks} activeTrack={activeTrack} onTrackSelect={onTrackSelect} />
                    {artist.tracks.length > 5 && (
                        <button className="artist-page__more" type="button" onClick={() => setAllTracks(!allTracks)}>
                            <span className="artist-page__more-label">{allTracks ? 'Свернуть' : 'Смотреть все'}</span>
                            <img className="artist-page__more-icon" src={chevronSmall} alt="" />
                        </button>
                    )}
                </section>
                <section className="artist-page__albums" aria-labelledby="artist-albums-title">
                    <h2
                        className="artist-page__section-title artist-page__section-title--albums"
                        id="artist-albums-title"
                    >
                        Альбомы <img className="artist-page__section-icon" src={chevron} alt="" />
                    </h2>
                    <ArtistAlbums albums={albums} />
                    {artist.albums.length > 3 && (
                        <button className="artist-page__more" type="button" onClick={() => setAllAlbums(!allAlbums)}>
                            <span className="artist-page__more-label">{allAlbums ? 'Свернуть' : 'Смотреть все'}</span>
                            <img className="artist-page__more-icon" src={chevronSmall} alt="" />
                        </button>
                    )}
                </section>
            </div>
        </div>
    )
}
