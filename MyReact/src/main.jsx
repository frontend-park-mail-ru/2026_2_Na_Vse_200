import { createElement, render, useState } from "./myReact/index.js"
import { VanillaRouter } from "./router/VanillaRouter.js"

const router = new VanillaRouter({
    type: "history",
    routes: {
        "/": "home",
        "/about": "about",
        "/tasks": "tasks",
        "*": "not-found"
    }
})

let currentPage = "home"

function App() {
    const [count, setCount] = useState(0)
    const [tasks, setTasks] = useState([
        { id: "learn", title: "Создать элементы" },
        { id: "render", title: "Научиться обновлять DOM" },
        { id: "keys", title: "Добавить key" }
    ])

    if (currentPage === "about") {
        return <main className="counter">
            <p className="eyebrow">МОЙ REACT · ROUTER</p>
            <h1>О проекте</h1>
            <p className="hint">Небольшой React-подобный движок и отдельный vanilla-JS роутер.</p>
            <a href="/" data-link>Вернуться на главную</a>
        </main>
    }

    if (currentPage === "tasks") {
        return <main className="counter task-page">
            <p className="eyebrow">МОЙ REACT · KEY</p>
            <h1>Список задач</h1>
            <p className="hint">Нажми кнопку: элементы поменяются местами, а их DOM-узлы сохранятся благодаря key.</p>
            <ul className="task-list">
                {tasks.map(task => <li key={task.id}>{task.title}</li>)}
            </ul>
            <button type="button" onClick={() => setTasks(([first, ...rest]) => [...rest, first])}>
                Перемешать порядок
            </button>
            <a href="/" data-link>На главную</a>
        </main>
    }

    if (currentPage === "not-found") {
        return <main className="counter">
            <p className="eyebrow">404</p>
            <h1>Страница не найдена</h1>
            <a href="/" data-link>На главную</a>
        </main>
    }

    return <main className="counter">
        <p className="eyebrow">МОЙ REACT · JSX + ROUTER</p>
        <h1>Привет, Артём!</h1>
        <p className="count">{count}</p>
        <button type="button" onClick={() => setCount(value => value + 1)}>
            Увеличить счётчик
        </button>
        <nav className="navigation">
            <a href="/about" data-link>О проекте</a>
            <a href="/tasks" data-link>Список с key</a>
        </nav>
        <p className="hint">Теперь разметка компонентов записывается привычным JSX синтаксисом.</p>
    </main>
}

const root = document.getElementById("root")
render(<App />, root)

router
    .on("route", event => {
        currentPage = event.detail.route ?? "not-found"
        render(<App />, root)
    })
    .listen()
