import type { SidebarProps } from './Sidebar.types.ts'
import { UserAvatar } from '../profile/UserAvatar.tsx'
import { createElement } from '@navse200/my-react'
import { Icon } from '../ui/Icon.tsx'
import logo from '../../assets/2une-dark-transparent.png'
import './Sidebar.css'
import homeIcon from '../../assets/artist/figma/home.svg'
import searchIcon from '../../assets/artist/figma/search.svg'
import libraryIcon from '../../assets/artist/figma/library.svg'
import plusIcon from '../../assets/artist/figma/plus.svg'
import heartIcon from '../../assets/artist/figma/playlist-heart-exact.svg'

const navigationIcons: Record<string, string> = { home: homeIcon, search: searchIcon, library: libraryIcon }
const playlistImages: Record<string, string> = { rose: heartIcon }

const navigation = [
    { label: 'Главная', href: '/', icon: 'home' },
    { label: 'Поиск', href: '#search', icon: 'search' },
    { label: 'Медиатека', href: '#library', icon: 'library' },
]

const playlists = [
    { name: 'Любимые треки', detail: 'Плейлист · 124 трека', icon: 'heart', color: 'rose' },
    { name: 'В дорогу', detail: 'Плейлист · 36 треков', icon: 'star', color: 'teal' },
    { name: 'Вечер', detail: 'Плейлист · 58 треков', icon: 'moon', color: 'amber' },
]

export function Sidebar({ route, user, onLogout, authAction, offline, className = '' }: SidebarProps) {
    return (
        <aside className={`sidebar ${className}`}>
            <a className="sidebar__brand" href="/" data-link aria-label="2une — на главную">
                <img className="sidebar__logo" src={logo} alt="2une tune" />
            </a>

            <nav className="sidebar__nav" aria-label="Основная навигация">
                {navigation.map(item => (
                    <a
                        className={`sidebar__nav-link${item.href === '/' && route === 'home' ? ' sidebar__nav-link--active' : ''}`}
                        href={item.href}
                        data-link={item.href.startsWith('/') ? 'true' : undefined}
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
                    </a>
                ))}
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
                    <a className="sidebar__playlist-link" href={`#${playlist.color}`} key={playlist.name}>
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
                    </a>
                ))}
            </nav>

            <div className="sidebar__account">
                <a
                    className="sidebar__profile"
                    href="/profile"
                    data-link
                    aria-label="Открыть профиль"
                    aria-current={route === 'profile' ? 'page' : undefined}
                >
                    <UserAvatar src={user?.avatar_url} className="sidebar__avatar" />
                    <span className="sidebar__account-copy">
                        <strong className="sidebar__account-name">
                            {user?.display_name || user?.email || 'Пользователь'}
                        </strong>
                        <small className="sidebar__account-detail">Личный аккаунт</small>
                    </span>
                </a>
                <button
                    className="sidebar__logout"
                    type="button"
                    onClick={onLogout}
                    disabled={authAction || offline}
                    aria-label="Выйти из аккаунта"
                    title={offline ? 'Для выхода подключитесь к интернету' : 'Выйти из аккаунта'}
                >
                    <Icon name="more" size={18} />
                </button>
            </div>
        </aside>
    )
}
