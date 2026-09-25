import { createElement } from '../../index.js';

/** @returns {object} Fallback page for unknown client-side URLs. */
export function NotFoundPage() {
    return <section className="page">
        <p className="eyebrow">404</p>
        <h1 tabIndex={-1}>Страница не найдена</h1>
        <p>Проверь адрес или вернись на главную.</p>
        <a className="action-link" href="/" data-link>На главную</a>
    </section>;
}
