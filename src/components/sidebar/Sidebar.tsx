import type { SidebarProps } from './Sidebar.types.ts'
import { UserAvatar } from '../profile/UserAvatar.tsx'
import { createElement } from '@navse200/my-react'
import { Icon } from '../ui/Icon.tsx'
import logo from '../../assets/2une-dark-transparent.png'
import './Sidebar.scss'
import homeIcon from '../../assets/artist/figma/home.svg'
import searchIcon from '../../assets/artist/figma/search.svg'
import libraryIcon from '../../assets/artist/figma/library.svg'
import plusIcon from '../../assets/artist/figma/plus.svg'
import heartIcon from '../../assets/artist/figma/playlist-heart-exact.svg'

const navigationIcons: Record<string, string> = { home: homeIcon, search: searchIcon, library: libraryIcon }
const playlistImages: Record<string, string> = { rose: heartIcon }

const navigation = [
    { label: 'Главная', href: '/', icon: 'home', disabled: false },
    { label: 'Поиск', icon: 'search', disabled: true },
    { label: 'Медиатека', icon: 'library', disabled: true },
]

const playlists = [
    { name: 'Любимые треки', detail: 'Плейлист · 124 трека', color: 'rose' },
    { name: 'В дорогу', detail: 'Плейлист · 36 треков', color: 'teal' },
    { name: 'Вечер', detail: 'Плейлист · 58 треков', color: 'amber' },
]

export function Sidebar({ route, user, className = '' }: SidebarProps) {
    return (
        <aside className={`sidebar ${className}`}>
            <a className="sidebar__brand" href="/" data-link aria-label="2une — на главную">
                <img className="sidebar__logo" src={logo} alt="2une tune" />
            </a>

            <nav className="sidebar__nav" aria-label="Основная навигация">
                {navigation.map(item => {
                    const Tag = item.disabled ? 'button' : 'a'
                    return (
                        <Tag
                            className={`sidebar__nav-link${item.href === '/' && route === 'home' ? ' sidebar__nav-link--active' : ''}`}
                            href={item.href}
                            type={item.disabled ? 'button' : undefined}
                            disabled={item.disabled}
                            data-link={item.disabled ? undefined : 'true'}
                            key={item.label}
                        >
                            <img
                                src={navigationIcons[item.icon]}
                                className={`sidebar__nav-icon sidebar__nav-icon--${item.icon}`}
                                alt=""
                            />
                            <span
                                className={`sidebar__nav-label${item.icon !== 'home' ? ' sidebar__nav-label--offset' : ''}`}
                            >
                                {item.label}
                            </span>
                        </Tag>
                    )
                })}
            </nav>

            <div className="sidebar__divider"></div>
            <div className="sidebar__playlist-heading">
                <span>Плейлисты</span>
                <button className="sidebar__playlist-add" type="button" aria-label="Создать плейлист">
                    <img src={plusIcon} alt="" />
                </button>
            </div>

            <nav className="sidebar__playlists" aria-label="Плейлисты">
                {playlists.map(playlist => (
                    <button className="sidebar__playlist-link" type="button" disabled key={playlist.name}>
                        <span className={`sidebar__playlist-icon sidebar__playlist-icon--${playlist.color}`}>
                            {playlistImages[playlist.color] ? (
                                <img src={playlistImages[playlist.color]} alt="" />
                            ) : (
                                <Icon name="music" size={26} />
                            )}
                        </span>
                        <span className="sidebar__playlist-copy">
                            <strong className="sidebar__playlist-name">{playlist.name}</strong>
                            <small className="sidebar__playlist-detail">{playlist.detail.replace(' · ', '  ')}</small>
                        </span>
                    </button>
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
