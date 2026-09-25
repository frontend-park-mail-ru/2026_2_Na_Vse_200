import { createElement } from '../../index.js';

/** @returns {object} Signup route placeholder; the form belongs to MUSIC-9. */
export function SignupPage() {
    return <section className="page">
        <p className="eyebrow">Аккаунт</p>
        <h1 tabIndex={-1}>Регистрация</h1>
        <p>Форма регистрации скоро появится.</p>
        <p>Уже есть аккаунт? <a href="/login" data-link>Войти</a></p>
    </section>;
}
