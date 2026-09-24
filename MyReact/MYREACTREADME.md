# Mini React

Учебный мини-движок для компонентов, состояния, keyed-списков и клиентской навигации.

## Запуск

```sh
npm install
npm start
```

Открой адрес Vite, указанный в терминале. Проверки запускаются командой `npm test`, production-сборка — `npm run build`.

## JSX

Компоненты можно писать JSX-разметкой в файлах `.jsx`. Vite преобразует JSX в вызовы собственного `createElement` — React и `react/jsx-runtime` не нужны.

```jsx
import { createElement, useState } from "./myReact/index.js"

function TodoList({ initialItems }) {
    const [items, setItems] = useState(initialItems)

    return <section className="todo-list">
        <h1>Задачи</h1>
        <ul>
            {items.map(item => <li key={item.id}>{item.title}</li>)}
        </ul>
        <button onClick={() => setItems(current => [...current].reverse())}>
            Изменить порядок
        </button>
    </section>
}
```

`key` нужен для элементов списков: он помогает сохранять соответствие между элементом списка и его DOM-узлом при перестановке. JSX-фрагменты `<>...</>` пока не поддерживаются; используйте обычный контейнер.

## Роутер

`VanillaRouter` поддерживает `history` и `hash` режимы, параметры `:name` в путях и событие `route`. Компоненты получают управление сами через обработчик события.

```js
import { VanillaRouter } from "./router/VanillaRouter.js"

const router = new VanillaRouter({
    type: "history",
    routes: { "/": "home", "/users/:id": "user", "*": "not-found" }
})

router.on("route", ({ detail }) => console.log(detail.route, detail.params))
    .listen()
```
