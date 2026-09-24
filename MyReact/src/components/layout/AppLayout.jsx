import { createElement } from "../../../myReact/index.js"
import "./AppLayout.css"

export function AppLayout({ children }) {
    return <div className="app-shell">
        <header className="app-header">
            <a className="brand" href="/" data-link>
                <span className="brand-mark">m</span>
                <span>
                    <strong>mini react</strong>
                    <small>учебный проект</small>
                </span>
            </a>

            <nav className="main-navigation" aria-label="Основная навигация">
                <a href="/" data-link>Главная</a>
                <a href="/tasks" data-link>Задачи</a>
                <a href="/about" data-link>О проекте</a>
            </nav>
        </header>

        <div className="page-content">{children}</div>
        <footer className="app-footer">Собственный мини-React · JSX · Vanilla Router</footer>
    </div>
}
