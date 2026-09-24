import { createElement } from "../../myReact/index.js"

export function NotFoundPage() {
    return <section className="text-page not-found-page">
        <p className="eyebrow">404 · НЕ НАЙДЕНО</p>
        <h1>Такой страницы пока нет</h1>
        <p>Выбери раздел в навигации, чтобы продолжить.</p>
    </section>
}
