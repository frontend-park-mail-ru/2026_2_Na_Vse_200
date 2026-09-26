"use strict";

import { createElement } from "../../../index.js"
import { Icon } from "../../components/ui/Icon.jsx"
import "./Sidebar.css"

const navigation = [
    { label: "Главная", href: "/", icon: "home", active: true },
    { label: "Поиск", href: "#search", icon: "search" },
    { label: "Медиатека", href: "#library", icon: "library" }
]

const playlists = [
    { name: "Любимые треки", icon: "heart", color: "rose" },
    { name: "Недавно слушали", icon: "history", color: "teal" },
    { name: "В дорогу", icon: "star", color: "amber" }
]

export function Sidebar() {
    return <aside className="sidebar">
        <a className="brand" href="/" data-link aria-label="MUSIC — на главную">
            <span className="brand-mark"><Icon name="music" size={20} /></span>
            <span>MUSIC</span>
        </a>

        <nav className="sidebar-nav" aria-label="Основная навигация">
            {navigation.map(item => <a
                className={`nav-link${item.active ? " is-active" : ""}`}
                href={item.href}
                data-link={item.href.startsWith("/") ? "true" : undefined}
                key={item.label}
            >
                <Icon name={item.icon} size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
            </a>)}
        </nav>

        <div className="sidebar-divider"></div>
        <div className="playlist-heading">
            <span>ТВОИ ПЛЕЙЛИСТЫ</span>
            <button type="button" aria-label="Создать плейлист"><Icon name="plus" size={18} /></button>
        </div>

        <nav className="playlist-links" aria-label="Плейлисты">
            {playlists.map(playlist => <a href={`#${playlist.color}`} key={playlist.name}>
                <span className={`playlist-icon playlist-icon-${playlist.color}`}>
                    <Icon name={playlist.icon} size={15} />
                </span>
                <span>{playlist.name}</span>
            </a>)}
        </nav>

        
    </aside>
}
