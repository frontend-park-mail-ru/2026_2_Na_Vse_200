import { createElement, useState } from '@navse200/my-react'
import { CatalogCover } from '../components/music/CatalogCover.tsx'
import { CatalogEmpty } from '../components/music/CatalogEmpty.tsx'
import { TrackList } from '../components/music/TrackList.tsx'
import { ArtistLinks } from '../components/artist/ArtistLinks.tsx'
import { Icon } from '../components/ui/Icon.tsx'
import { trackCount } from '../features/music/catalog.ts'
import { errorMessage } from '../shared/lib/forms.ts'
import type { CatalogStatus, Track, TrackArtist } from '../types/domain.ts'
import play from '../assets/artist/figma/listen-play.svg'
import shuffle from '../assets/catalog/shuffle.png'
import './CatalogPages.scss'

interface Props {
    title: string
    kind: 'playlist' | 'favorites' | 'album'
    cover?: string | null
    description?: string
    artists?: (TrackArtist | string)[]
    tracks: Track[]
    count?: number
    status?: CatalogStatus
    error?: string
    notice?: string
    activeTrack?: Track
    guest?: boolean
    onPlay: (track: Track, tracks: Track[]) => void
    onRetry?: () => void
    onAdd?: () => void
    onEdit?: () => void
    onDelete?: () => void
    onRemove?: (track: Track) => Promise<void>
}

export function TrackCollectionPage({
    title,
    kind,
    cover,
    description,
    artists,
    tracks,
    count = tracks.length,
    status = 'ready',
    error,
    notice,
    activeTrack,
    guest,
    onPlay,
    onRetry,
    onAdd,
    onEdit,
    onDelete,
    onRemove,
}: Props) {
    const [removeError, setRemoveError] = useState('')
    const [removing, setRemoving] = useState(false)
    const favorite = kind === 'favorites'
    const columns = tracks.length > 7 && tracks.length <= 14
    const shuffleTracks = () => {
        const queue = [...tracks]
        for (let index = queue.length - 1; index > 0; index--) {
            const next = Math.floor(Math.random() * (index + 1))
            ;[queue[index], queue[next]] = [queue[next], queue[index]]
        }
        if (queue[0]) onPlay(queue[0], queue)
    }
    const removeTrack = async (track: Track) => {
        if (removing) return
        setRemoving(true)
        try {
            await onRemove?.(track)
            setRemoveError('')
        } catch (failure) {
            setRemoveError(errorMessage(failure))
        } finally {
            setRemoving(false)
        }
    }

    return (
        <section className="track-collection">
            <header className="track-collection__hero">
                <CatalogCover className="track-collection__cover" src={cover} favorite={favorite} large />
                <div className="track-collection__intro">
                    <small>{kind === 'album' ? 'альбом' : 'плейлист'}</small>
                    <h1>{title}</h1>
                    {kind === 'album' && artists?.length ? (
                        <p>
                            <ArtistLinks track={{ id: '', artists }} />
                        </p>
                    ) : (
                        <p>{trackCount(count)}</p>
                    )}
                    {description && <p className="track-collection__description">{description}</p>}
                    <div className="track-collection__actions">
                        {tracks.length > 0 && (
                            <button className="catalog-button" type="button" onClick={() => onPlay(tracks[0], tracks)}>
                                <img className="track-collection__play" src={play} alt="" /> Слушать
                            </button>
                        )}
                        {onAdd && (
                            <button className="catalog-button" type="button" onClick={onAdd}>
                                {tracks.length ? 'Добавить трек' : 'Добавить треки'}
                            </button>
                        )}
                        {(favorite || tracks.length > 0) && (
                            <button
                                className="catalog-button catalog-button--icon track-collection__shuffle-button"
                                type="button"
                                aria-label="Перемешать треки"
                                onClick={shuffleTracks}
                                disabled={!tracks.length}
                            >
                                <img className="track-collection__shuffle" src={shuffle} alt="" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="catalog-button catalog-button--coral catalog-button--icon"
                                type="button"
                                aria-label="Удалить плейлист"
                                onClick={onDelete}
                            >
                                <Icon name="trash" />
                            </button>
                        )}
                        {onEdit && (
                            <button className="catalog-button" type="button" onClick={onEdit}>
                                Редактировать
                            </button>
                        )}
                    </div>
                </div>
            </header>
            <div className="track-collection__body">
                {notice && (
                    <p className="track-collection__notice" role="status">
                        {notice}
                    </p>
                )}
                {removeError && <p role="alert">{removeError}</p>}
                {status !== 'ready' || tracks.length ? (
                    <div className={`track-collection__list${columns ? ' track-collection__list--wide' : ''}`}>
                        <TrackList
                            tracks={tracks}
                            activeTrack={activeTrack}
                            onTrackSelect={track => onPlay(track, tracks)}
                            status={status}
                            error={error}
                            onRetry={onRetry}
                            columns={columns}
                            longColumns={columns}
                            label={`Треки — ${title}`}
                            onRemove={onRemove && !removing ? removeTrack : undefined}
                        />
                    </div>
                ) : favorite ? (
                    <CatalogEmpty
                        title="Здесь будут любимые треки"
                        description={
                            guest
                                ? 'Войдите, чтобы сохранять любимые композиции.'
                                : count
                                  ? 'Сведения о треках пока недоступны в каталоге.'
                                  : 'Отметьте композицию сердечком, чтобы добавить её в избранное.'
                        }
                    >
                        <a className="catalog-button" href={guest ? '/login?next=/favorites' : '/search'} data-link>
                            {guest ? 'Войти' : 'Найти музыку'}
                        </a>
                    </CatalogEmpty>
                ) : kind === 'playlist' ? (
                    <CatalogEmpty
                        title="В плейлисте пока нет треков"
                        description="Добавьте любимые треки, чтобы начать слушать."
                    >
                        <button className="catalog-button" type="button" onClick={onAdd}>
                            Добавить треки
                        </button>
                    </CatalogEmpty>
                ) : (
                    <CatalogEmpty title="Треки альбома пока недоступны" />
                )}
                {favorite && tracks.length > 0 && count > tracks.length && (
                    <p className="track-collection__notice">Часть треков пока недоступна в каталоге.</p>
                )}
            </div>
        </section>
    )
}
