import { createElement, useState } from "../../../myReact/index.js"
import { Button } from "../../components/ui/Button.jsx"
import "./Counter.css"

export function Counter() {
    const [count, setCount] = useState(0)

    return <section className="counter-feature" aria-labelledby="counter-title">
        <p className="eyebrow">FEATURE · STATE</p>
        <h1 id="counter-title">Счётчик состояния</h1>
        <p className="counter-value" aria-live="polite">{count}</p>
        <Button onClick={() => setCount(value => value + 1)}>
            Увеличить счётчик
        </Button>
        <p className="feature-hint">
            Нажми кнопку: useState изменит состояние, а мини-React обновит дерево.
        </p>
    </section>
}
