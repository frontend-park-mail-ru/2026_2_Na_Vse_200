import { createElement } from '@navse200/my-react'
import { CatalogCards } from '../components/music/CatalogCards.tsx'
import { playlistHref, trackCount } from '../features/music/catalog.ts'
import type { Playlist } from '../features/music/playlists.ts'
import './CatalogPages.scss'

interface Props {
    playlists: Playlist[]
    favoriteCount: number
    notice: string
    onCreate: () => void
}

export function LibraryPage({ playlists, favoriteCount, notice, onCreate }: Props) {
    const items = playlists.map(playlist => ({
        id: playlist.id,
        title: playlist.name,
        cover_url: playlist.cover,
        detail: trackCount(playlist.tracks.length),
        href: playlistHref(playlist.id),
    }))
    return (
        <section className="catalog-page">
            <header className="catalog-page__heading">
                <h1>Медиатека</h1>
                <button className="catalog-button" type="button" onClick={onCreate}>
                    Создать плейлист
                </button>
            </header>
            <h2>Плейлисты</h2>
            <CatalogCards
                items={[
                    {
                        id: 'favorites',
                        title: 'Избранное',
                        detail: trackCount(favoriteCount),
                        href: '/favorites',
                        favorite: true,
                    },
                    ...items,
                ]}
            />
            {notice && (
                <p className="catalog-page__notice" role="status">
                    {notice}
                </p>
            )}
        </section>
    )
}
