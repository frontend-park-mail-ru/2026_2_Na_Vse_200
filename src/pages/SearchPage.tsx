import { createElement, useState } from '@navse200/my-react'
import { CatalogCards } from '../components/music/CatalogCards.tsx'
import { CatalogEmpty } from '../components/music/CatalogEmpty.tsx'
import { CatalogSearchField } from '../components/music/CatalogSearchField.tsx'
import { TrackList } from '../components/music/TrackList.tsx'
import { Icon } from '../components/ui/Icon.tsx'
import { albumHref, searchCatalog } from '../features/music/catalog.ts'
import { getArtistName } from '../features/music/presentation.ts'
import { artistHref } from '../features/artist/route.ts'
import type { Catalog, CatalogStatus, Track } from '../types/domain.ts'
import './CatalogPages.scss'

const tabs = [
    { id: 'all', label: 'Все' },
    { id: 'tracks', label: 'Треки' },
    { id: 'artists', label: 'Исполнители' },
    { id: 'albums', label: 'Альбомы' },
] as const
type Tab = (typeof tabs)[number]['id']
const trackPreviewSize = 6

interface Props {
    catalog: Catalog
    status: CatalogStatus
    error: string
    onRetry: () => void
    activeTrack?: Track
    onPlay: (track: Track, queue: Track[]) => void
    initialQuery: string
    initialTab: string | null
    onSearchChange: (query: string, tab: Tab) => void
}

export function SearchPage({
    catalog,
    status,
    error,
    onRetry,
    activeTrack,
    onPlay,
    initialQuery,
    initialTab,
    onSearchChange,
}: Props) {
    const [query, setQuery] = useState(initialQuery)
    const [tab, setTab] = useState<Tab>(tabs.find(item => item.id === initialTab)?.id ?? 'all')
    const [allTracks, setAllTracks] = useState(false)
    const results = searchCatalog(catalog, query)
    const hasResults = Boolean(results.tracks.length || results.artists.length || results.albums.length)
    const changeQuery = (value: string) => {
        setQuery(value)
        setTab('all')
        setAllTracks(false)
        onSearchChange(value, 'all')
    }
    const changeTab = (value: Tab, expandTracks = false) => {
        setTab(value)
        setAllTracks(expandTracks)
        onSearchChange(query, value)
    }

    const showTracks = (tab === 'all' || tab === 'tracks') && results.tracks.length > 0
    const showArtists = (tab === 'all' || tab === 'artists') && results.artists.length > 0
    const showAlbums = (tab === 'all' || tab === 'albums') && results.albums.length > 0
    const tracks = allTracks ? results.tracks : results.tracks.slice(0, trackPreviewSize)

    return (
        <section className="catalog-page search-page">
            <h1>Поиск</h1>
            <CatalogSearchField
                query={query}
                onChange={changeQuery}
                label="Поиск музыки"
                placeholder="Начните искать..."
            />
            {!query.trim() && (
                <CatalogEmpty
                    title="Тут пока ничего нет"
                    description="Найдите любимый трек, альбом или исполнителя"
                    illustrated
                />
            )}
            {query.trim() && status !== 'ready' && (
                <TrackList
                    tracks={[]}
                    status={status === 'idle' ? 'loading' : status}
                    error={error}
                    onRetry={onRetry}
                    onTrackSelect={() => {}}
                />
            )}
            {query.trim() && status === 'ready' && !hasResults && (
                <CatalogEmpty
                    title="Ничего не найдено"
                    description="Попробуйте изменить запрос или проверьте написание."
                    illustrated
                >
                    <button
                        className="catalog-button catalog-button--coral"
                        type="button"
                        onClick={() => changeQuery('')}
                    >
                        Очистить поиск
                    </button>
                </CatalogEmpty>
            )}
            {hasResults && status === 'ready' && (
                <div className="search-page__results">
                    <div className="search-page__filters" role="group" aria-label="Тип результатов">
                        {tabs.map(item => (
                            <button
                                className="catalog-button catalog-button--dark"
                                type="button"
                                key={item.id}
                                aria-pressed={tab === item.id ? 'true' : 'false'}
                                onClick={() => changeTab(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {showTracks && (
                        <section>
                            <TrackList
                                tracks={tracks}
                                activeTrack={activeTrack}
                                onTrackSelect={track => onPlay(track, results.tracks)}
                                columns={!allTracks}
                                label="Треки"
                            />
                            {results.tracks.length > trackPreviewSize && (
                                <button
                                    className="catalog-more"
                                    type="button"
                                    aria-expanded={allTracks ? 'true' : 'false'}
                                    onClick={() => {
                                        if (tab === 'all') changeTab('tracks', true)
                                        else setAllTracks(!allTracks)
                                    }}
                                >
                                    {allTracks ? 'Свернуть' : 'Смотреть все'} <Icon name="chevronRight" size={16} />
                                </button>
                            )}
                        </section>
                    )}
                    {(showArtists || showAlbums) && (
                        <div
                            className={`search-page__collections${tab === 'all' ? ' search-page__collections--split' : ''}`}
                        >
                            {showArtists && (
                                <section>
                                    <div className="catalog-page__heading">
                                        <h2>Исполнители</h2>
                                        {tab === 'all' && (
                                            <button
                                                className="catalog-more"
                                                type="button"
                                                onClick={() => changeTab('artists')}
                                            >
                                                Смотреть все <Icon name="chevronRight" size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <CatalogCards
                                        round
                                        items={(tab === 'all' ? results.artists.slice(0, 3) : results.artists).map(
                                            artist => ({ ...artist, href: artistHref(artist.id) }),
                                        )}
                                    />
                                </section>
                            )}
                            {showAlbums && (
                                <section>
                                    <div className="catalog-page__heading">
                                        <h2>Альбомы</h2>
                                        {tab === 'all' && (
                                            <button
                                                className="catalog-more"
                                                type="button"
                                                onClick={() => changeTab('albums')}
                                            >
                                                Смотреть все <Icon name="chevronRight" size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <CatalogCards
                                        items={(tab === 'all' ? results.albums.slice(0, 4) : results.albums).map(
                                            album => ({
                                                ...album,
                                                href: albumHref(album.id),
                                                detail: getArtistName(album),
                                            }),
                                        )}
                                    />
                                </section>
                            )}
                        </div>
                    )}
                    {!showTracks && !showArtists && !showAlbums && (
                        <CatalogEmpty title="Ничего не найдено в этой категории" />
                    )}
                </div>
            )}
        </section>
    )
}
