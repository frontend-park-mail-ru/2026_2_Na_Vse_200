import { createElement, useState } from '../../index.js'
import { FormField } from '../components/ui/FormField.jsx'
import { login } from '../features/auth/api.js'
import './SignupPage.css'
import './LoginPage.css'

/** @param {{notice?: string, onAuthenticated?: (user: object) => void}} props Сообщение и обработчик успешного входа. @returns {object} Форма входа. */
export function LoginPage({ notice, onAuthenticated } = {}) {
    const [state, setState] = useState({ message: '', errors: {}, pending: false })
    // Отменяем отправку формы браузером, чтобы email и пароль не попали в URL.
    function submit(event) {
        event.preventDefault()
        const form = event.currentTarget
        const email = form.elements.namedItem('email').value.trim().toLowerCase()
        const password = form.elements.namedItem('password').value
        const errors = {}
        if (!email) errors.email = 'Введите email'
        if (!password) errors.password = 'Введите пароль'
        if (Object.keys(errors).length) {
            setState({ message: '', errors, pending: false })
            return
        }
        setState({ message: '', errors: {}, pending: true })
        login({ email, password })
            .then(user => onAuthenticated?.(user))
            .catch(error => setState({ message: error.message, errors: error.fields || {}, pending: false }))
    }
    return (
        <section className="signup-screen login-screen" aria-labelledby="login-title">
            <aside className="signup-art login-art">
                <p>
                    Слушай.
                    <br />
                    Сохраняй.
                    <br />
                    Открывай новое.
                </p>
            </aside>
            <div className="signup-panel login-panel">
                <div className="signup-content login-content">
                    <h1 id="login-title" tabIndex={-1}>
                        Вход
                    </h1>
                    <p className="signup-intro login-intro">С возвращением! Войдите, чтобы продолжить слушать.</p>
                    {notice ? (
                        <p className="login-notice" role="status">
                            {notice}
                        </p>
                    ) : null}
                    <form onSubmit={submit}>
                        <FormField
                            idPrefix="login"
                            name="email"
                            label="Эл. почта"
                            type="email"
                            placeholder="e-mail"
                            autoComplete="username"
                            error={state.errors.email}
                            disabled={state.pending}
                        />
                        <FormField
                            idPrefix="login"
                            name="password"
                            label="Пароль"
                            type="password"
                            placeholder="password"
                            autoComplete="current-password"
                            error={state.errors.password}
                            disabled={state.pending}
                        />
                        <div className="login-options">
                            <label className="login-remember">
                                <input type="checkbox" name="remember" checked />
                                Запомнить меня
                            </label>
                            <button
                                className="login-text-button"
                                type="button"
                                onClick={() =>
                                    setState(previous => ({
                                        ...previous,
                                        message: 'Восстановление пароля пока недоступно.',
                                    }))
                                }
                            >
                                Забыли пароль?
                            </button>
                        </div>
                        <button className="signup-submit login-submit" type="submit" disabled={state.pending}>
                            {state.pending ? 'Входим…' : 'Войти'}
                        </button>
                    </form>
                    <div className="login-divider">
                        <span>или</span>
                    </div>
                    <button
                        className="login-code-button"
                        type="button"
                        onClick={() =>
                            setState(previous => ({ ...previous, message: 'Вход по коду из письма пока недоступен.' }))
                        }
                    >
                        Войти по коду из письма
                    </button>
                    <p className="login-feedback" role="status">
                        {state.message}
                    </p>
                    <p className="signup-login login-signup">
                        Нет аккаунта?{' '}
                        <a href="/signup" data-link>
                            Зарегистрироваться
                        </a>
                    </p>
                </div>
            </div>
        </section>
    )
}
