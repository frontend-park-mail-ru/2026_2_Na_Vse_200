import { createElement } from '../shared/lib/my-react/index.js'

export function NotFoundPage() {
    return (
        <section className="not-found-page">
            <p className="not-found-page__code">404</p>
            <h1 className="not-found-page__title" tabIndex={-1}>
                Страница не найдена
            </h1>
            <p>Проверь адрес или вернись на главную.</p>
            <a className="not-found-page__link" href="/" data-link>
                На главную
            </a>
        </section>
    )
}
