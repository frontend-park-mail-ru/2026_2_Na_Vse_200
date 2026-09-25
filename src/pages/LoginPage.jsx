import { createElement, useState } from '../../index.js';
import { FormField } from '../components/ui/FormField.jsx';
import '../features/signup/SignupPage.css';
import '../features/login/LoginPage.css';

/** @param {{notice?: string}} props Registration result. @returns {object} Login layout; API integration is pending. */
export function LoginPage({ notice } = {}) {
    const [message, setMessage] = useState('');
    // Prevent native form submission: credentials must never be placed in the URL.
    function submit(event) {
        event.preventDefault();
        setMessage('Вход пока недоступен. Попробуйте позже.');
    }
    return <section className="signup-screen login-screen" aria-labelledby="login-title">
        <aside className="signup-art login-art">
            <p>Слушай.<br />Сохраняй.<br />Открывай новое.</p>
        </aside>
        <div className="signup-panel login-panel"><div className="signup-content login-content">
            <h1 id="login-title" tabIndex={-1}>Вход</h1>
            <p className="signup-intro login-intro">С возвращением! Войдите, чтобы продолжить слушать.</p>
            {notice ? <p className="login-notice" role="status">{notice}</p> : null}
            <form onSubmit={submit}>
                <FormField idPrefix="login" name="email" label="Эл. почта" type="email" placeholder="e-mail" autoComplete="username" />
                <FormField idPrefix="login" name="password" label="Пароль" type="password" placeholder="password" autoComplete="current-password" />
                <div className="login-options">
                    <label className="login-remember"><input type="checkbox" name="remember" checked />Запомнить меня</label>
                    <button className="login-text-button" type="button" onClick={() => setMessage('Восстановление пароля пока недоступно.')}>Забыли пароль?</button>
                </div>
                <button className="signup-submit login-submit" type="submit">Войти</button>
            </form>
            <div className="login-divider"><span>или</span></div>
            <button className="login-code-button" type="button" onClick={() => setMessage('Вход по коду из письма пока недоступен.')}>Войти по коду из письма</button>
            <p className="login-feedback" role="status">{message}</p>
            <p className="signup-login login-signup">Нет аккаунта? <a href="/signup" data-link>Зарегистрироваться</a></p>
        </div></div>
    </section>;
}
