import { createElement, useState } from '../shared/lib/my-react/index.js'
import { signup } from '../features/signup/api.js'
import { validateSignup } from '../features/signup/validation.js'
import { FormField } from '../components/ui/FormField.jsx'
import logo from '../assets/2une-dark-transparent.png'
import './AuthPage.css'

export const SignupPage = ({ onRegistered }) => {
    const [state, setState] = useState({ errors: {}, message: '', pending: false })
    const readValues = form => ({
        display_name: form.elements.namedItem('display_name').value,
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
        const { errors } = validateSignup(readValues(input.form))
        setState(previous => ({ ...previous, errors: { ...previous.errors, [name]: errors[name] || '' } }))
    }
    const submit = async event => {
        event.preventDefault()
        if (state.pending) return
        const form = event.currentTarget
        const { data, errors } = validateSignup(readValues(form))
        if (Object.keys(errors).length) {
            setState({ errors, message: '', pending: false })
            const input = form.elements.namedItem(Object.keys(errors)[0])
            input.focus()
            return
        }
        setState({ errors: {}, message: '', pending: true })
        try {
            await signup(data)
            if (!form.isConnected) return
            const password = form.elements.namedItem('password')
            password.value = ''
            onRegistered()
        } catch (error) {
            if (!form.isConnected) return
            setState({ errors: error.fields || {}, message: error.message, pending: false })
            const first = Object.keys(error.fields || {})[0]
            if (first) form.elements.namedItem(first).focus()
        }
    }
    return (
        <section className="auth-page" aria-labelledby="signup-title">
            <aside className="auth-page__art" aria-label="Музыка под настроение, каждый день">
                <img className="auth-page__logo" src={logo} alt="2une tune" />
                <p className="auth-page__slogan">
                    Музыка
                    <br />
                    под твое
                    <br />
                    настроение
                </p>
            </aside>
            <div className="auth-page__panel">
                <div className="auth-page__content">
                    <h1 className="auth-page__title" id="signup-title" tabIndex={-1}>
                        Регистрация
                    </h1>
                    <p className="auth-page__intro">Пара секунд — и можно слушать.</p>
                    <form
                        className="auth-page__form"
                        noValidate
                        onSubmit={submit}
                        aria-busy={state.pending ? 'true' : 'false'}
                    >
                        <FormField
                            name="display_name"
                            label="Имя"
                            placeholder="имя"
                            autoComplete="nickname"
                            error={state.errors.display_name}
                            onInput={clearError}
                            onBlur={validateField}
                            disabled={state.pending}
                        />
                        <FormField
                            name="email"
                            label="Электронная почта"
                            type="email"
                            placeholder="электронная почта"
                            autoComplete="email"
                            error={state.errors.email}
                            onInput={clearError}
                            onBlur={validateField}
                            disabled={state.pending}
                        />
                        <FormField
                            name="password"
                            label="Пароль"
                            type="password"
                            placeholder="пароль"
                            autoComplete="new-password"
                            error={state.errors.password}
                            onInput={clearError}
                            onBlur={validateField}
                            disabled={state.pending}
                        />
                        <div className="auth-page__feedback" role="alert">
                            {state.message}
                        </div>
                        <button className="auth-page__submit" type="submit" disabled={state.pending}>
                            {state.pending ? 'Создаём аккаунт…' : 'Создать аккаунт'}
                        </button>
                    </form>
                    <p className="auth-page__switch">
                        Уже есть аккаунт?{' '}
                        <a href="/login" data-link>
                            Войти
                        </a>
                    </p>
                </div>
            </div>
        </section>
    )
}
