import { createElement } from '../../index.js';

/** @returns {object} Login route placeholder; the form belongs to MUSIC-21. */
export function LoginPage() {
    return <section className="page">
        <p className="eyebrow">Аккаунт</p>
        <h1 tabIndex={-1}>Вход</h1>
        <p>Форма входа скоро появится.</p>
        <p>Нет аккаунта? <a href="/signup" data-link>Зарегистрироваться</a></p>
    </section>;
}
