"use strict";

import { createElement } from "../../../MyReact/index.js"
import { Sidebar } from "../../features/sidebar/Sidebar.jsx"
import { Player } from "../../features/player/Player.jsx"
import "./AppLayout.css"

export function AppLayout({ children, activeTrack }) {
    return <div className="app-shell">
        <Sidebar />
        <div className="app-main-column">
            <main className="app-content">{children}</main>
        </div>
        <Player track={activeTrack} />
    </div>
}