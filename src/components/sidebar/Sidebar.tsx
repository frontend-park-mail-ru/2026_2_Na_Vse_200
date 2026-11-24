import type { SidebarProps } from './Sidebar.types.ts'
import { UserAvatar } from '../profile/UserAvatar.tsx'
import { createElement } from '@navse200/my-react'
import { CatalogCover } from '../music/CatalogCover.tsx'
import { playlistHref, trackCount } from '../../features/music/catalog.ts'
import logo from '../../assets/2une-dark-transparent.png'
import './Sidebar.scss'
import homeIcon from '../../assets/artist/figma/home.svg'
import searchIcon from '../../assets/artist/figma/search.svg'
import libraryIcon from '../../assets/artist/figma/library.svg'
import plusIcon from '../../assets/artist/figma/plus.svg'

const navigation = [
    { label: 'Главная', href: '/', icon: homeIcon, route: 'home' },
    { label: 'Поиск', href: '/search', icon: searchIcon, route: 'search' },
    { label: 'Медиатека', href: '/library', icon: libraryIcon, route: 'library' },
]

export function Sidebar({ route, user, className = '', playlists, favoriteCount, playlistId, onCreate }: SidebarProps) {
    const shortcuts = [
        { id: 'favorites', name: 'Избранное', href: '/favorites', count: favoriteCount, favorite: true, cover: '' },
        ...playlists.map(playlist => ({
            ...playlist,
            href: playlistHref(playlist.id),
            count: playlist.trackCount,
            favorite: false,
        })),
    ]
    return (
        <aside className={`sidebar ${className}`}>
            <a className="sidebar__brand" href="/" data-link aria-label="2une — на главную">
                <img className="sidebar__logo" src={logo} alt="2une tune" />
            </a>

            <nav className="sidebar__nav" aria-label="Основная навигация">
                {navigation.map(item => {
                    const active = route === item.route
                    return (
                        <a
                            className={`sidebar__nav-link${active ? ' sidebar__nav-link--active' : ''}`}
                            href={item.href}
                            data-link
                            aria-label={item.label}
                            aria-current={active ? 'page' : undefined}
                            key={item.route}
                        >
                            <img
                                src={item.icon}
                                className={`sidebar__nav-icon sidebar__nav-icon--${item.route}`}
                                alt=""
                            />
                            <span
                                className={`sidebar__nav-label${item.route !== 'home' ? ' sidebar__nav-label--offset' : ''}`}
                            >
                                {item.label}
                            </span>
                        </a>
                    )
                })}
            </nav>

            <div className="sidebar__divider"></div>
            {onCreate && (
                <div className="sidebar__playlist-heading">
                    <span>Плейлисты</span>
                    <button
                        className="sidebar__playlist-add"
                        type="button"
                        aria-label="Создать плейлист"
                        onClick={onCreate}
                    >
                        <img src={plusIcon} alt="" />
                    </button>
                </div>
            )}

            <nav className="sidebar__playlists" aria-label={onCreate ? 'Плейлисты' : 'Избранное'}>
                {shortcuts.map(playlist => (
                    <a
                        className="sidebar__playlist-link"
                        href={playlist.href}
                        data-link
                        key={playlist.id}
                        aria-current={
                            (playlist.favorite ? route === 'favorites' : playlistId === playlist.id)
                                ? 'page'
                                : undefined
                        }
                    >
                        <CatalogCover
                            className="sidebar__playlist-icon"
                            src={playlist.cover}
                            favorite={playlist.favorite}
                        />
                        <span className="sidebar__playlist-copy">
                            <strong className="sidebar__playlist-name">{playlist.name}</strong>
                            <small className="sidebar__playlist-detail">Плейлист · {trackCount(playlist.count)}</small>
                        </span>
                    </a>
                ))}
            </nav>

            <div className="sidebar__account">
                <a
                    className="sidebar__profile"
                    href={user ? '/profile' : '/login'}
                    data-link
                    aria-label={user ? 'Открыть профиль' : 'Войти в аккаунт'}
                    aria-current={route === 'profile' ? 'page' : undefined}
                >
                    <UserAvatar src={user?.avatar_url} className="sidebar__avatar" />
                    <span className="sidebar__account-copy">
                        <strong className="sidebar__account-name">
                            {user?.display_name || user?.email || 'Войдите в профиль'}
                        </strong>
                        <small className="sidebar__account-detail">Личный аккаунт</small>
                    </span>
                </a>
            </div>
        </aside>
    )
}
