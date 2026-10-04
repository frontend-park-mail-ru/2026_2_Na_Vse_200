import { createElement } from '../../shared/lib/my-react/index.js'
import { Icon } from '../ui/Icon.jsx'
import logo from '../../assets/2une-dark-transparent.png'
import './Sidebar.css'

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

export function Sidebar({ user, onLogout, authAction }) {
    return (
        <aside className="sidebar">
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
                        <Icon name={item.icon} size={18} className="sidebar__nav-icon" />
                        <span className="sidebar__nav-label">{item.label}</span>
                    </a>
                ))}
            </nav>

            <div className="sidebar__divider"></div>
            <div className="sidebar__playlist-heading">
                <span>Плейлисты</span>
                <button type="button" aria-label="Создать плейлист">
                    <Icon name="plus" size={18} />
                </button>
            </div>

            <nav className="sidebar__playlists" aria-label="Плейлисты">
                {playlists.map(playlist => (
                    <a href={`#${playlist.color}`} key={playlist.name}>
                        <span className={`sidebar__playlist-icon sidebar__playlist-icon--${playlist.color}`}>
                            <Icon name={playlist.icon} size={15} />
                        </span>
                        <span className="sidebar__playlist-copy">
                            <strong>{playlist.name}</strong>
                            <small>{playlist.detail}</small>
                        </span>
                    </a>
                ))}
            </nav>

            <div className="sidebar__account">
                <span className="sidebar__avatar" aria-hidden="true">
                    {(user?.display_name || user?.email || 'П').slice(0, 1).toUpperCase()}
                </span>
                <span className="sidebar__account-copy">
                    <strong>{user?.display_name || user?.email || 'Пользователь'}</strong>
                    <small>Личный аккаунт</small>
                </span>
                <button type="button" onClick={onLogout} disabled={authAction} aria-label="Выйти из аккаунта">
                    <Icon name="more" size={18} />
                </button>
            </div>
        </aside>
    )
}
