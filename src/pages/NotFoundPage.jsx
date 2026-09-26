import { createElement } from '../../index.js';

export function NotFoundPage() {
    return <section className="text-page not-found-page">
        <p className="eyebrow">404</p>
        <h1 tabIndex={-1}>Страница не найдена</h1>
        <p>Проверь адрес или вернись на главную.</p>
        <a className="action-link" href="/" data-link>На главную</a>
    </section>;
}
