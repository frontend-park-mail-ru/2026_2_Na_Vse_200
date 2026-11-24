import { createElement } from '@navse200/my-react'
import { CatalogCards } from '../components/music/CatalogCards.tsx'
import { playlistHref, trackCount } from '../features/music/catalog.ts'
import type { PlaylistCard } from '../features/music/playlists.ts'
import './CatalogPages.scss'

interface Props {
    playlists: PlaylistCard[]
    favoriteCount: number
    notice: string
    onCreate?: () => void
    error: string
    loading: boolean
    onRetry: () => void
}

export function LibraryPage({ playlists, favoriteCount, notice, onCreate, error, loading, onRetry }: Props) {
    const items = playlists.map(playlist => ({
        id: playlist.id,
        title: playlist.name,
        cover_url: playlist.cover,
        detail: trackCount(playlist.trackCount),
        href: playlistHref(playlist.id),
    }))
    return (
        <section className="catalog-page">
            <header className="catalog-page__heading">
                <h1>Медиатека</h1>
                {onCreate && (
                    <button className="catalog-button" type="button" onClick={onCreate}>
                        Создать плейлист
                    </button>
                )}
            </header>
            {onCreate && <h2>Плейлисты</h2>}
            {!onCreate && (
                <p>
                    <a href="/login?next=/library" data-link>
                        Войдите
                    </a>
                    , чтобы пользоваться плейлистами.
                </p>
            )}
            {loading && <p role="status">Загружаем плейлисты…</p>}
            {error && (
                <p role="alert">
                    {error}{' '}
                    <button type="button" onClick={onRetry}>
                        Повторить
                    </button>
                </p>
            )}
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
