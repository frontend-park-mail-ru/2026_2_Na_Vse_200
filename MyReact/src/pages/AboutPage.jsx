import { createElement } from "../../myReact/index.js"

export function AboutPage() {
    return <section className="text-page">
        <p className="eyebrow">ПРО ПРОЕКТ</p>
        <h1>Небольшой React, написанный самостоятельно</h1>
        <p>
            Здесь JSX преобразуется в элементы собственного дерева. Мини-React
            отображает компоненты, обновляет состояние и согласует DOM по ключам.
        </p>
        <p>
            Роутер написан на чистом JavaScript и работает в режимах History и Hash.
        </p>
    </section>
}
