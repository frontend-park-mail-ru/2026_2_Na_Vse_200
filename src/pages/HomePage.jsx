import { createElement } from '../../index.js';

/** @returns {object} Home route placeholder; catalogue UI belongs to MUSIC-22. */
export function HomePage() {
    return <section className="page">
        <p className="eyebrow">На все 200 · Музыка</p>
        <h1 tabIndex={-1}>Главная</h1>
        <p>Здесь появятся треки, исполнители и альбомы.</p>
        <a className="action-link" href="/signup" data-link>Создать аккаунт</a>
    </section>;
}
