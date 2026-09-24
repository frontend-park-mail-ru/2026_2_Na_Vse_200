# Mini React

Учебный проект с собственным JSX-движком и клиентским приложением.

## Структура

```text
MyReact/                    # самостоятельная реализация мини-React
├── createElement.js        # создание виртуальных элементов и текстовых узлов
├── render.js               # компоненты, DOM-согласование и useState
├── index.js                # публичный API движка
└── README.md

src/                        # приложение на JSX
├── app/                    # сборка приложения и конфигурация маршрутов
├── components/             # общие UI-компоненты и каркас
├── features/               # счётчик и список задач
├── pages/                  # страницы приложения
├── shared/lib/              # независимые утилиты, включая VanillaRouter
├── styles/                 # глобальные стили
└── main.jsx                # точка входа

tests/                      # проверки движка и роутера
```

Приложение использует движок через публичный API из `MyReact/index.js`. Вся работа с виртуальным деревом, DOM-узлами и состоянием остаётся внутри `MyReact/`; файлы из `src/` описывают интерфейс и его поведение.

## Запуск

```sh
npm install
npm start
```

Для проверок: `npm test`. Для production-сборки: `npm run build`.

## JSX

JSX в `.jsx` преобразуется Vite в вызовы собственного `createElement`; React и `react/jsx-runtime` не используются.

Пример компонента `src/features/todos/TodoList.jsx`:

```jsx
import { createElement, useState } from "../../../MyReact/index.js"

export function TodoList({ initialItems }) {
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

Импортируй `createElement` в каждом JSX-модуле: он настроен как JSX-фабрика в `vite.config.js`. Для списков задавай стабильный `key`. JSX-фрагменты пока не поддерживаются.

## Роутинг

Маршруты приложения задаются в `src/app/router.js`. Реализация независимого History/Hash-роутера находится в `src/shared/lib/VanillaRouter.js`.