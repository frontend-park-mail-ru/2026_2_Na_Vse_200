import type { CollectionItem, HomePageProps } from '../types/domain.ts'
import type { CoverProps, CollectionProps } from './HomePage.types.ts'
import { createElement, useState } from '@navse200/my-react'
import { Icon } from '../components/ui/Icon.tsx'
import { TrackList } from '../components/music/TrackList.tsx'
import './HomePage.scss'
import { artistHref } from '../features/artist/route.ts'
import { API_ORIGIN } from '../config.ts'

const Cover = ({ cover, icon = 'music' }: CoverProps) => {
    const [failedCover, setFailedCover] = useState('')
    const image = cover?.startsWith('/') ? API_ORIGIN.replace(/\/$/, '') + cover : cover
    const coverError = () => setFailedCover(image ?? '')
    return (
        <span className="music-cover">
            {image && failedCover !== image ? (
                <img src={image} alt="" loading="lazy" onError={coverError} />
            ) : (
                <Icon name={icon} size={20} />
            )}
        </span>
    )
}
const CollectionSection = ({ title, items, type, tracksStatus }: CollectionProps) => {
    const emptyMessage = () => {
        if (tracksStatus === 'loading') return 'Загружаем…'
        if (tracksStatus === 'error') return 'Не удалось загрузить данные.'
        return type === 'artist' ? 'Пока нет исполнителей.' : 'Пока нет альбомов.'
    }
    const renderCard = (item: CollectionItem) => (
        <article className="music-collection__card" key={item.id}>
            {type === 'artist' ? (
                <a
                    className="music-collection__card-content music-collection__artist-link"
                    href={artistHref(item.id)}
                    data-link
                >
                    <Cover cover={item.image_url} icon="artist" />
                    <strong title={item.name}>{item.name}</strong>
                </a>
            ) : (
                <div className="music-collection__card-content">
                    <Cover cover={item.cover_url} icon="music" />
                    <strong title={item.title}>{item.title}</strong>
                </div>
            )}
        </article>
    )
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
            {items.length === 0 && <p className="music-collection__empty">{emptyMessage()}</p>}
            <div className={`music-collection__list music-collection__list--${type}`}>
                {items.slice(0, 4).map(renderCard)}
            </div>
        </section>
    )
}
export const HomePage = ({
    tracks = [],
    artists = [],
    albums = [],
    activeTrack,
    onTrackSelect = () => {},
    tracksStatus = 'ready',
    tracksError = '',
    onTracksRetry = () => {},
}: HomePageProps) => {
    const playPlaylist = () => {
        const track = tracks[0]
        if (track) onTrackSelect(track)
    }
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
                    <button type="button" onClick={playPlaylist} disabled={!tracks.length}>
                        <Icon name="play" size={16} /> Слушать
                    </button>
                </div>
            </section>

            <section className="home-page__popular" aria-labelledby="popular-title">
                <h2 id="popular-title">Популярные треки</h2>
                <TrackList
                    tracks={tracks.slice(0, 6)}
                    activeTrack={activeTrack}
                    onTrackSelect={onTrackSelect}
                    status={tracksStatus}
                    error={tracksError}
                    onRetry={onTracksRetry}
                    columns
                />
            </section>

            <div className="home-page__collections">
                <CollectionSection title="Исполнители" items={artists} type="artist" tracksStatus={tracksStatus} />
                <CollectionSection title="Альбомы" items={albums} type="album" tracksStatus={tracksStatus} />
            </div>
        </div>
    )
}
