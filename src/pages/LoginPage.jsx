import { createElement, useState } from '../shared/lib/my-react/index.js'
import { login } from '../features/auth/api.js'
import { validateLogin } from '../features/auth/validation.js'
import { FormField } from '../components/ui/FormField.jsx'
import logo from '../assets/2une-dark-transparent.png'
import './AuthPage.css'

export const LoginPage = ({ notice, onAuthenticated } = {}) => {
    const [state, setState] = useState({ message: '', errors: {}, pending: false })
    const readValues = form => ({
        email: form.elements.namedItem('email').value,
        password: form.elements.namedItem('password').value,
    })
    const clearError = event => {
        const name = event.currentTarget.name
        if (state.errors[name] || state.message) {
            setState(previous => ({ ...previous, message: '', errors: { ...previous.errors, [name]: '' } }))
        }
    }
    const validateField = event => {
        if (state.pending) return
        const input = event.currentTarget
        const name = input.name
        const { errors } = validateLogin(readValues(input.form))
        setState(previous => ({ ...previous, errors: { ...previous.errors, [name]: errors[name] || '' } }))
    }
    const submit = async event => {
        event.preventDefault()
        if (state.pending) return
        const form = event.currentTarget
        const { data, errors } = validateLogin(readValues(form))
        if (Object.keys(errors).length) {
            setState({ message: 'Проверьте email или пароль', errors, pending: false })
            const input = form.elements.namedItem(Object.keys(errors)[0])
            input.focus()
            return
        }
        setState({ message: '', errors: {}, pending: true })
        try {
            const user = await login(data)
            if (form.isConnected) onAuthenticated?.(user)
        } catch (error) {
            if (form.isConnected) setState({ message: error.message, errors: error.fields || {}, pending: false })
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
