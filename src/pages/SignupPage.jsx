import { createElement, useState } from '../../index.js'
import { FormField } from '../components/ui/FormField.jsx'
import { validateSignup } from '../features/signup/validation.js'
import { signup } from '../features/signup/api.js'
import './AuthPage.css'

/** @param {{onRegistered: () => void}} props Переход после регистрации. @returns {object} Экран регистрации. */
export function SignupPage({ onRegistered }) {
    const [state, setState] = useState({ errors: {}, message: '', pending: false })

    function readValues(form) {
        return Object.fromEntries(
            ['display_name', 'email', 'password'].map(name => [name, form.elements.namedItem(name).value]),
        )
    }
    function clearError(event) {
        const name = event.target.name
        if (state.errors[name] || state.message)
            setState(previous => ({ ...previous, message: '', errors: { ...previous.errors, [name]: '' } }))
    }
    function validateField(event) {
        const { name, form } = event.target
        if (form.dataset.submitting === 'true') return
        const { errors } = validateSignup(readValues(form))
        setState(previous => ({ ...previous, errors: { ...previous.errors, [name]: errors[name] || '' } }))
    }
    async function submit(event) {
        event.preventDefault()
        const form = event.currentTarget
        if (form.dataset.submitting === 'true') return
        const { data, errors } = validateSignup(readValues(form))
        if (Object.keys(errors).length) {
            setState({ errors, message: '', pending: false })
            form.elements.namedItem(Object.keys(errors)[0]).focus()
            return
        }
        form.dataset.submitting = 'true'
        setState({ errors: {}, message: '', pending: true })
        try {
            await signup(data)
            if (!form.isConnected) return
            form.elements.namedItem('password').value = ''
            onRegistered()
        } catch (error) {
            if (!form.isConnected) return
            setState({ errors: error.fields || {}, message: error.message, pending: false })
            const firstField = Object.keys(error.fields || {})[0]
            if (firstField) form.elements.namedItem(firstField).focus()
        } finally {
            form.dataset.submitting = 'false'
        }
    }
    return (
        <section className="auth-screen" aria-labelledby="signup-title">
            <aside className="auth-art" aria-label="Музыка под настроение, каждый день">
                <p>
                    Музыка
                    <br />
                    под твое
                    <br />
                    настроение
                </p>
            </aside>
            <div className="auth-panel">
                <div className="auth-content">
                    <h1 id="signup-title" tabIndex={-1}>
                        Регистрация
                    </h1>
                    <p className="auth-intro">Пара секунд — и можно слушать.</p>
                    <form noValidate onSubmit={submit} aria-busy={state.pending ? 'true' : 'false'}>
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
                        <div className="auth-feedback" role="alert">
                            {state.message}
                        </div>
                        <button className="auth-submit" type="submit" disabled={state.pending}>
                            {state.pending ? 'Создаём аккаунт…' : 'Создать аккаунт'}
                        </button>
                    </form>
                    <p className="auth-switch">
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
