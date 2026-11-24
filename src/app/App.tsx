import type { VNode } from '@navse200/my-react'
import { createElement, render } from '@navse200/my-react'
import { createPlayer } from '../shared/audio/player.ts'
import { connectionAvailable, observeConnection, subscribeConnection } from '../shared/offline/network.ts'
import { artistFeature } from '../features/artist/feature.ts'
import { getCacheScope } from '../shared/offline/storage.ts'
import { appStore } from './store.ts'
import { createSession } from './session.ts'
import { favorites } from '../features/music/favorites.ts'
import { AppLayout } from '../components/layout/AppLayout.tsx'
import { ModalHost } from '../components/modal/ModalHost.tsx'
import { modals } from '../components/modal/manager.ts'
import { HomePage } from '../pages/HomePage.tsx'
import { ProfilePage } from '../pages/ProfilePage.tsx'
import { LogoutDialog } from '../components/profile/LogoutDialog.tsx'
import { AuthPage } from '../pages/AuthPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { SearchPage } from '../pages/SearchPage.tsx'
import { LibraryPage } from '../pages/LibraryPage.tsx'
import { TrackCollectionPage } from '../pages/TrackCollectionPage.tsx'
import { CatalogEmpty } from '../components/music/CatalogEmpty.tsx'
import { PlaylistDelete, PlaylistForm, PlaylistTrackPicker } from '../components/music/PlaylistDialogs.tsx'
import { createPlaylists } from '../features/music/playlists.ts'
import { createAlbum, createSearch } from '../features/music/controllers.ts'
import type { SearchKind } from '../features/music/api.ts'
import { playlistHref } from '../features/music/catalog.ts'
import type { User, Track, EntityId } from '../types/domain.ts'
import type { VanillaRouter } from '../shared/lib/VanillaRouter.ts'

const titles: Record<string, string> = {
    home: 'Главная',
    profile: 'Профиль',
    artist: artistFeature.title,
    album: 'Альбом',
    search: 'Поиск',
    library: 'Медиатека',
    playlist: 'Плейлист',
    favorites: 'Избранное',
    login: 'Вход',
    signup: 'Регистрация',
    'not-found': 'Страница не найдена',
}

const sessionRoutes = ['home', 'profile', 'artist', 'album', 'search', 'library', 'playlist', 'favorites']
const searchKind = (value: string | null): SearchKind =>
    value === 'tracks' || value === 'artists' || value === 'albums' ? value : 'all'

/**
 * Запускает приложение и подписывает его на изменения данных и маршрута.
 * @returns Функцию очистки подписок, запросов и плеера при размонтировании.
 */
export const mountApp = (container: HTMLElement, router: VanillaRouter) => {
    const stopObserving = observeConnection()
    appStore.reset()
    const session = createSession()
    const player = createPlayer()
    const artist = artistFeature.createController()
    const playlists = createPlaylists()
    const albumController = createAlbum()
    const search = createSearch()
    const picker = createSearch(true)
    void favorites.load(null, true)
    let disposed = false
    let notice = ''
    let selectedTrack: Track | undefined
    let activeTrackId: EntityId | undefined
    let queue: Track[] = []
    let selectedQueue: Track[] | undefined
    let searchVisit = 0

    const resetMusic = () => {
        selectedTrack = undefined
        activeTrackId = undefined
        selectedQueue = undefined
        appStore.reset()
        artist.reset()
        albumController.reset()
    }

    const authenticated = (user: User) => {
        const next = router.getCurrentUrl().searchParams.get('next')
        resetMusic()
        session.setUser(user)
        notice = ''
        const canResume =
            next &&
            (next === '/profile' || next === '/library' || next === '/favorites' || /^\/playlists\/[^/?#]+$/.test(next))
        router.navigate(canResume ? next : '/')
    }
    const accountClosed = (message: string, path = '/login') => {
        resetMusic()
        session.clear()
        modals.close()
        notice = message
        router.navigate(path, { replace: true })
    }
    const expired = () => accountClosed('Сессия истекла. Войдите снова.', '/login?next=/profile')
    const signOut = async () => {
        if (!connectionAvailable()) throw new Error('Для выхода из аккаунта подключитесь к интернету.')
        if (!(await session.signOut())) {
            throw new Error(session.getState().error || 'Не удалось выйти из аккаунта. Попробуйте ещё раз.')
        }
        resetMusic()
        modals.close()
        notice = ''
        router.navigate('/', { replace: true })
    }
    const confirmSignOut = () => modals.open(<LogoutDialog onConfirm={signOut} />)
    const playFrom = (track: Track, tracks: Track[]) => {
        selectedTrack = track
        selectedQueue = tracks
        activeTrackId = track.id
        renderCurrent()
        void player.play()
    }
    player.setOnEnded(() => {
        const index = queue.findIndex(track => track.id === activeTrackId)
        if (queue.length > 1) playFrom(queue[(index + 1) % queue.length], queue)
    })
    const retry = async () => {
        await session.restore()
        if (disposed) return
        retryFavorites()
        if (session.getState().status === 'ready') {
            appStore.setState({ status: 'idle', offline: false })
            playlists.refresh()
        }
        syncRoute(true)
        renderCurrent()
    }

    const retryArtist = () => {
        const match = router.findRoute(router.getCurrentUrl().pathname)
        void artist.load(match?.params.id ?? '', getCacheScope())
    }
    const retryFavorites = () => void favorites.load(session.getState().user?.id ?? null, true)
    const createPlaylist = () => {
        if (!session.getState().user) return
        modals.open(
            <PlaylistForm
                onSave={async details => {
                    const id = await playlists.save(details)
                    router.navigate(playlistHref(id))
                }}
            />,
        )
    }
    const updateSearch = (query: string, tab: SearchKind) => {
        const params = new URLSearchParams()
        if (query.trim()) params.set('q', query.trim())
        const delay = search.getState().query !== query.trim() ? 250 : 0
        if (tab !== 'all') params.set('type', tab)
        window.history.replaceState(window.history.state, '', params.size ? `/search?${params}` : '/search')
        search.load(query, tab, delay)
    }

    const renderCurrent = () => {
        if (disposed) return
        const { user, status, error, pending } = session.getState()
        const url = router.getCurrentUrl()
        const match = router.findRoute(url.pathname)
        const route = match?.value ?? 'not-found'
        const id = match?.params.id ?? ''
        const catalog = appStore.getState()
        const favoriteState = favorites.getState()
        const library = playlists.getState()
        const playlistNotice = library.notice?.href === url.pathname ? library.notice.message : ''
        const playlist = user && library.detailId === id ? library.detail : null
        const screen = artist.getState()
        const currentArtist = screen.id === id ? screen.artist : undefined
        const albumState = albumController.getState()
        const album = albumState.id === id ? albumState.album : null
        const searchState = search.getState()
        const favoriteTracks = Object.values(favoriteState.tracks).filter(track => favoriteState.ids[String(track.id)])
        const favoriteCount = Object.values(favoriteState.ids).filter(Boolean).length
        const routeQueues: Record<string, Track[]> = {
            artist: currentArtist?.tracks ?? [],
            album: album?.tracks ?? [],
            search: searchState.results.tracks,
            playlist: playlist?.tracks ?? [],
            favorites: favoriteTracks,
        }
        const routeQueue = routeQueues[route] ?? catalog.tracks
        queue = selectedQueue ?? routeQueue
        const activeTrack = selectedTrack ?? queue.find(track => track.id === activeTrackId) ?? queue[0]
        if (activeTrack) activeTrackId = activeTrack.id
        const needsSession = sessionRoutes.includes(route)
        const data = route === 'artist' ? screen : route === 'album' ? albumState : catalog
        const offline =
            !connectionAvailable() ||
            status === 'offline' ||
            (['home', 'artist', 'album'].includes(route) && data.offline)
        player.setTrack(needsSession ? activeTrack : undefined)
        document.title = `${titles[route] ?? titles['not-found']} — На все 200`

        const albumLoading = albumState.id !== id || albumState.status === 'loading'
        const albumFailed = albumState.id === id && albumState.status === 'error'
        const retryAlbum = () => void albumController.load(id)
        const playlistLoading = library.detailId !== id || library.detailStatus === 'loading'
        const playlistFailed = library.detailId === id && library.detailStatus === 'error'
        const retryPlaylist = () => void playlists.loadDetail(id)
        const trackProps = {
            activeTrack,
            onTrackSelect: (track: Track) => playFrom(track, routeQueue),
            tracksStatus: data.status === 'idle' ? ('loading' as const) : data.status,
            tracksError: data.error,
            onTracksRetry: route === 'artist' ? retryArtist : appStore.loadCatalog,
        }
        const collectionProps = { activeTrack, onPlay: playFrom }
        const pages: Record<string, VNode> = {
            home: <HomePage {...catalog} {...trackProps} />,
            search: (
                <SearchPage
                    key={searchVisit}
                    results={searchState.results}
                    status={searchState.status}
                    error={searchState.error}
                    loadingMore={searchState.loadingMore}
                    onMore={search.more}
                    onRetry={search.retry}
                    initialQuery={url.searchParams.get('q') ?? ''}
                    initialTab={url.searchParams.get('type')}
                    onSearchChange={updateSearch}
                    {...collectionProps}
                />
            ),
            library: (
                <LibraryPage
                    playlists={user ? library.items : []}
                    favoriteCount={favoriteCount}
                    notice={playlistNotice}
                    onCreate={user ? createPlaylist : undefined}
                    loading={Boolean(user && library.status === 'loading')}
                    error={library.error}
                    onRetry={playlists.loadList}
                />
            ),
            favorites: (
                <TrackCollectionPage
                    title="Избранное"
                    kind="favorites"
                    tracks={favoriteTracks}
                    count={favoriteCount}
                    status={favoriteState.status === 'loading' ? 'loading' : 'ready'}
                    guest={!user}
                    {...collectionProps}
                />
            ),
            album: album ? (
                <TrackCollectionPage
                    key={id}
                    title={album.title ?? 'Альбом'}
                    kind="album"
                    tracks={album.tracks}
                    cover={album.cover_url}
                    artists={album.artists}
                    {...collectionProps}
                />
            ) : albumLoading ? (
                <CatalogEmpty title="Загружаем альбом…" />
            ) : (
                <CatalogEmpty title={albumFailed ? albumState.error : 'Альбом не найден'}>
                    {albumFailed && (
                        <button className="catalog-button" type="button" onClick={retryAlbum}>
                            Попробовать ещё раз
                        </button>
                    )}
                    <a className="catalog-button" href="/search" data-link>
                        К поиску
                    </a>
                </CatalogEmpty>
            ),
            playlist: !user ? (
                <CatalogEmpty title="Войдите, чтобы открыть плейлист">
                    <a className="catalog-button" href={`/login?next=${encodeURIComponent(url.pathname)}`} data-link>
                        Войти
                    </a>
                </CatalogEmpty>
            ) : playlist ? (
                <TrackCollectionPage
                    key={id}
                    title={playlist.name}
                    kind="playlist"
                    cover={playlist.cover}
                    description={playlist.description}
                    tracks={playlist.tracks}
                    notice={playlistNotice}
                    {...collectionProps}
                    onAdd={() => {
                        picker.load('', 'tracks')
                        modals.open(
                            <PlaylistTrackPicker
                                playlist={playlist}
                                search={picker}
                                onSave={tracks => playlists.addTracks(playlist.id, tracks)}
                            />,
                        )
                    }}
                    onEdit={() =>
                        modals.open(
                            <PlaylistForm
                                playlist={playlist}
                                onSave={details => playlists.save(details, playlist.id)}
                            />,
                        )
                    }
                    onDelete={() =>
                        modals.open(
                            <PlaylistDelete
                                playlist={playlist}
                                onDelete={async () => {
                                    await playlists.remove(playlist)
                                    router.navigate('/library', { replace: true })
                                }}
                            />,
                        )
                    }
                    onRemove={track => playlists.removeTrack(playlist.id, track.id)}
                />
            ) : playlistLoading ? (
                <CatalogEmpty title="Загружаем плейлист…" />
            ) : (
                <CatalogEmpty title={playlistFailed ? library.detailError : 'Плейлист не найден'}>
                    {playlistFailed && (
                        <button className="catalog-button" type="button" onClick={retryPlaylist}>
                            Попробовать ещё раз
                        </button>
                    )}
                    <a className="catalog-button" href="/library" data-link>
                        В медиатеку
                    </a>
                </CatalogEmpty>
            ),
            artist: (
                <artistFeature.Page
                    key={id}
                    artist={currentArtist}
                    artistId={match?.params.id ?? ''}
                    {...trackProps}
                    offline={offline}
                />
            ),
            profile: user ? (
                <fieldset className="offline-auth" disabled={offline}>
                    <ProfilePage
                        user={user}
                        onUserUpdated={session.setUser}
                        onSessionExpired={expired}
                        onAccountClosed={accountClosed}
                        onLogout={confirmSignOut}
                        authAction={pending}
                    />
                </fieldset>
            ) : (
                <p role="status">Профиль не сохранён. Подключитесь к интернету и войдите.</p>
            ),
            login: <AuthPage key="login" mode="login" notice={notice} onAuthenticated={authenticated} />,
            signup: <AuthPage key="signup" mode="signup" onRegistered={authenticated} />,
        }
        let page = pages[route] ?? <NotFoundPage />
        if (route === 'login' || route === 'signup') {
            page = (
                <fieldset className="offline-auth" disabled={offline}>
                    {page}
                </fieldset>
            )
        }
        const waiting = needsSession && ['idle', 'loading', 'error'].includes(status)
        if (waiting) {
            page =
                status === 'error' ? (
                    <main className="session-loading" role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={retry}>
                            Попробовать ещё раз
                        </button>
                    </main>
                ) : (
                    <main className="session-loading" aria-label="Загрузка" aria-busy="true" />
                )
        } else {
            page = (
                <AppLayout
                    player={player}
                    tracks={queue}
                    route={route}
                    user={user}
                    onTrackSelect={track => playFrom(track, queue)}
                    activeTrack={activeTrack}
                    sessionError={error}
                    playlists={user ? library.items : []}
                    favoriteCount={favoriteCount}
                    playlistId={route === 'playlist' ? (playlist?.id ?? id) : undefined}
                    onCreatePlaylist={user ? createPlaylist : undefined}
                >
                    {page}
                </AppLayout>
            )
        }
        render(
            <div className="application">
                {offline ? (
                    <div className="offline-banner" role="status">
                        Нет соединения. Доступны сохранённые экраны; вход и изменения требуют интернета.
                        <button className="offline-banner__retry" type="button" onClick={retry}>
                            Проверить соединение
                        </button>
                    </div>
                ) : null}
                {page}
                {library.importMessage && (
                    <div className="favorites-error" role="status">
                        {library.importMessage}
                        {library.importFailed && (
                            <button className="favorites-error__retry" type="button" onClick={playlists.retryImport}>
                                Повторить
                            </button>
                        )}
                    </div>
                )}
                {favoriteState.error ? (
                    <div className="favorites-error" role="alert">
                        {favoriteState.error}
                        <button className="favorites-error__retry" type="button" onClick={retryFavorites}>
                            Повторить
                        </button>
                    </div>
                ) : null}
                <ModalHost />
            </div>,
            container,
        )
    }

    const syncRoute = (force = false) => {
        if (disposed) return
        const url = router.getCurrentUrl()
        const match = router.findRoute(url.pathname)
        const route = match?.value
        if (!sessionRoutes.includes(route ?? '')) return
        const { user, status } = session.getState()
        if (status === 'idle') {
            void session.restore().then(() => syncRoute())
            return
        }
        if (status === 'ready' && !user && route === 'profile') {
            appStore.reset()
            artist.reset()
            selectedTrack = undefined
            router.navigate('/login?next=/profile', { replace: true })
            return
        }
        if (status !== 'ready' && status !== 'offline') return
        const id = match?.params.id ?? ''
        if (route === 'home' && appStore.getState().status === 'idle') {
            void appStore.loadCatalog()
        } else if (route === 'search') {
            const query = url.searchParams.get('q') ?? ''
            const kind = searchKind(url.searchParams.get('type'))
            const loaded = search.getState()
            if (force || loaded.query !== query.trim() || loaded.kind !== kind) search.load(query, kind)
        } else if (route === 'artist' && (force || artist.getState().id !== id)) {
            void artist.load(id, getCacheScope())
        } else if (route === 'album' && (force || albumController.getState().id !== id)) {
            void albumController.load(id)
        } else if (route === 'playlist' && user && (force || playlists.getState().detailId !== id)) {
            void playlists.loadDetail(id)
        }
    }
    const handleRoute = () => {
        modals.close()
        artist.cancel()
        const { pathname } = router.getCurrentUrl()
        const route = router.findRoute(pathname)?.value
        if (route === 'search') searchVisit++
        else search.cancel()
        picker.cancel()
        if (route !== 'album') albumController.cancel()
        if (route !== 'playlist') playlists.clearDetail()
        if (playlists.getState().notice?.href !== pathname) playlists.clearNotice()
        renderCurrent()
        container.querySelector<HTMLElement>('h1')?.focus()
        container.querySelector('.app-shell__content')?.scrollTo(0, 0)
        syncRoute(true)
    }
    const sessionChanged = () => {
        const { status, user } = session.getState()
        if (status === 'ready' || status === 'offline') {
            if (!user && modals.getState().content) modals.close()
            playlists.load(user?.id ?? null, status === 'ready')
            void favorites.load(user?.id ?? null)
        }
        renderCurrent()
    }
    const connectionChanged = () => {
        if (!connectionAvailable()) modals.close()
        renderCurrent()
        if (connectionAvailable())
            queueMicrotask(() => {
                if (!disposed) void retry()
            })
    }
    const modalChanged = () => {
        if (!modals.getState().content) picker.cancel()
        renderCurrent()
    }
    const unsubscribe = [
        session.subscribe(sessionChanged),
        ...[favorites, player, artist, appStore, playlists, albumController, search, picker].map(store =>
            store.subscribe(renderCurrent),
        ),
        modals.subscribe(modalChanged),
        subscribeConnection(connectionChanged),
    ]
    renderCurrent()
    router.on('route', handleRoute).listen()
    return () => {
        disposed = true
        unsubscribe.forEach(stop => stop())
        stopObserving()
        session.destroy()
        artist.destroy()
        playlists.destroy()
        albumController.cancel()
        search.cancel()
        picker.cancel()
        player.dispose()
        router.off('route', handleRoute).destroy()
        modals.close()
        render(null, container)
    }
}
