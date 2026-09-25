import { createElement } from '../../index.js';

/** @param {{notice?: string}} props Registration result. @returns {object} Login placeholder. */
export function LoginPage({ notice }) {
    return <section className="page">
        <p className="eyebrow">Аккаунт</p>
        <h1 tabIndex={-1}>Вход</h1>
        {notice ? <p role="status">{notice}</p> : null}
        <p>Форма входа скоро появится.</p>
        <p>Нет аккаунта? <a href="/signup" data-link>Зарегистрироваться</a></p>
    </section>;
}
