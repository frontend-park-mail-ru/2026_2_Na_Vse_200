import { createElement } from '../../shared/lib/my-react/index.js'
import { Icon } from '../ui/Icon.jsx'
import logo from '../../assets/2une-dark-transparent.png'
import './Sidebar.css'
import homeIcon from '../../assets/artist/figma/home.svg'
import searchIcon from '../../assets/artist/figma/search.svg'
import libraryIcon from '../../assets/artist/figma/library.svg'
import plusIcon from '../../assets/artist/figma/plus.svg'
import heartIcon from '../../assets/artist/figma/playlist-heart-exact.svg'
import accountIcon from '../../assets/artist/figma/account-exact.svg'

const navigationIcons = { home: homeIcon, search: searchIcon, library: libraryIcon }
const playlistImages = { rose: heartIcon }

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

export function Sidebar({ user, className = '' }) {
    return (
        <aside className={`sidebar ${className}`}>
            <a className="sidebar__brand" href="/" data-link aria-label="2une — на главную">
                <img className="sidebar__logo" src={logo} alt="2une tune" />
            </a>

            <nav className="sidebar__nav" aria-label="Основная навигация">
                {navigation.map(item => (
                    <a
                        className={`sidebar__nav-link${item.href === '/' ? ' sidebar__nav-link--active' : ''}`}
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
                <span className="sidebar__avatar" aria-hidden="true">
                    <img src={accountIcon} alt="" />
                </span>
                <span className="sidebar__account-copy">
                    <strong className="sidebar__account-name">
                        {user?.display_name || user?.email || 'Пользователь'}
                    </strong>
                    <small className="sidebar__account-detail">Личный аккаунт</small>
                </span>
            </div>
        </aside>
    )
}
