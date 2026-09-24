import { createElement, useState } from "../../../myReact/index.js"
import { Button } from "../../components/ui/Button.jsx"
import "./TaskList.css"

const initialTasks = [
    { id: "learn", title: "Создать элементы", detail: "createElement и JSX" },
    { id: "render", title: "Обновлять DOM", detail: "согласование дерева" },
    { id: "keys", title: "Сохранять key", detail: "идентичность элементов списка" }
]

export function TaskList() {
    const [tasks, setTasks] = useState(initialTasks)

    function rotateTasks() {
        setTasks(([first, ...rest]) => [...rest, first])
    }

    return <section className="tasks-feature" aria-labelledby="tasks-title">
        <p className="eyebrow">FEATURE · KEYED LIST</p>
        <h1 id="tasks-title">Задачи проекта</h1>
        <p className="feature-hint">
            Переставь элементы и посмотри, как key сохраняет DOM-узлы.
        </p>

        <ul className="task-list">
            {tasks.map(task => <li className="task-card" key={task.id}>
                <span className="task-check" aria-hidden="true">✓</span>
                <span>
                    <strong>{task.title}</strong>
                    <small>{task.detail}</small>
                </span>
            </li>)}
        </ul>

        <Button onClick={rotateTasks}>Изменить порядок</Button>
    </section>
}
