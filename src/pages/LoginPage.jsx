import { createElement, useState } from '../shared/lib/my-react/index.js'
import { FormField } from '../components/ui/FormField.jsx'
import { login } from '../features/auth/api.js'
import './AuthPage.css'

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
        <section className="auth-screen" aria-labelledby="login-title">
            <aside className="auth-art">
                <p>
                    Слушай
                    <br />
                    Сохраняй
                    <br />
                    Открывай новое
                </p>
            </aside>
            <div className="auth-panel">
                <div className="auth-content">
                    <h1 id="login-title" tabIndex={-1}>
                        Вход
                    </h1>
                    <p className="auth-intro">
                        С возвращением! <br />
                        Войдите, чтобы продолжить слушать.
                    </p>
                    {notice ? (
                        <p className="login-notice" role="status">
                            {notice}
                        </p>
                    ) : null}
                    <form onSubmit={submit}>
                        <FormField
                            idPrefix="login"
                            name="email"
                            label="Электронная почта"
                            type="email"
                            placeholder="почта"
                            autoComplete="username"
                            error={state.errors.email}
                            disabled={state.pending}
                        />
                        <FormField
                            idPrefix="login"
                            name="password"
                            label="Пароль"
                            type="password"
                            placeholder="пароль"
                            autoComplete="current-password"
                            error={state.errors.password}
                            disabled={state.pending}
                        />
                        <button className="auth-submit" type="submit" disabled={state.pending}>
                            {state.pending ? 'Входим…' : 'Войти'}
                        </button>
                    </form>

                    <p className="auth-feedback" role="status">
                        {state.message}
                    </p>
                    <p className="auth-switch">
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
