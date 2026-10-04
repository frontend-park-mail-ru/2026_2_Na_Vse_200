import { createElement, useState } from '../shared/lib/my-react/index.js'
import { FormField } from '../components/ui/FormField.jsx'
import { login } from '../features/auth/api.js'
import { validateLogin } from '../features/auth/validation.js'
import logo from '../assets/2une-dark-transparent.png'
import './AuthPage.css'

/** @param {{notice?: string, onAuthenticated?: (user: object) => void}} props Сообщение и обработчик успешного входа. @returns {object} Форма входа. */
export function LoginPage({ notice, onAuthenticated } = {}) {
    const [state, setState] = useState({ message: '', errors: {}, pending: false })
    function readValues(form) {
        return {
            email: form.elements.namedItem('email').value,
            password: form.elements.namedItem('password').value,
        }
    }

    function clearError(event) {
        const name = event.target.name
        if (state.errors[name] || state.message) {
            setState(previous => ({ ...previous, message: '', errors: { ...previous.errors, [name]: '' } }))
        }
    }

    function validateField(event) {
        const { name, form } = event.target
        if (form.dataset.submitting === 'true') return
        const { errors } = validateLogin(readValues(form))
        setState(previous => ({ ...previous, errors: { ...previous.errors, [name]: errors[name] || '' } }))
    }

    async function submit(event) {
        event.preventDefault()
        const form = event.currentTarget
        if (form.dataset.submitting === 'true') return
        const { data, errors } = validateLogin(readValues(form))
        if (Object.keys(errors).length) {
            setState({ message: 'Неверный email или пароль', errors, pending: false })
            form.elements.namedItem(Object.keys(errors)[0]).focus()
            return
        }
        form.dataset.submitting = 'true'
        setState({ message: '', errors: {}, pending: true })
        try {
            const user = await login(data)
            if (form.isConnected) onAuthenticated?.(user)
        } catch (error) {
            if (form.isConnected) setState({ message: error.message, errors: error.fields || {}, pending: false })
        } finally {
            form.dataset.submitting = 'false'
        }
    }

    return (
        <section className="auth-page" aria-labelledby="login-title">
            <aside className="auth-page__art">
                <img className="auth-page__logo" src={logo} alt="2une tune" />
                <p className="auth-page__slogan">
                    Слушай
                    <br />
                    Сохраняй
                    <br />
                    Открывай новое
                </p>
            </aside>
            <div className="auth-page__panel">
                <div className="auth-page__content">
                    <h1 className="auth-page__title" id="login-title" tabIndex={-1}>
                        Вход
                    </h1>
                    <p className="auth-page__intro">
                        С возвращением! <br />
                        Войдите, чтобы продолжить слушать.
                    </p>
                    {notice ? (
                        <p className="auth-page__notice" role="status">
                            {notice}
                        </p>
                    ) : null}
                    <form
                        className="auth-page__form auth-page__form--login"
                        noValidate
                        onSubmit={submit}
                        aria-busy={state.pending ? 'true' : 'false'}
                    >
                        <p className="auth-page__feedback" role="alert">
                            {state.message}
                        </p>
                        <FormField
                            idPrefix="login"
                            name="email"
                            label="Электронная почта"
                            type="email"
                            placeholder="почта"
                            autoComplete="username"
                            error={state.errors.email}
                            onInput={clearError}
                            onBlur={validateField}
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
                            onInput={clearError}
                            onBlur={validateField}
                            disabled={state.pending}
                        />
                        <button className="auth-page__submit" type="submit" disabled={state.pending}>
                            {state.pending ? 'Входим…' : 'Войти'}
                        </button>
                    </form>

                    <p className="auth-page__switch">
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
