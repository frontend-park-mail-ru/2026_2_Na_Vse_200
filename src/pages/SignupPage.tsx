import type { FormState } from '../types/domain.ts'
import type { SignupValues } from '../features/signup/validation.ts'
import { SignupError } from '../features/signup/api.ts'
import { getInput, errorMessage } from '../shared/lib/forms.ts'
import { createElement, useState } from '../../myReact/index.ts'
import { FormField } from '../components/ui/FormField.tsx'
import { validateSignup } from '../features/signup/validation.ts'
import { signup } from '../features/signup/api.ts'
import './AuthPage.css'

/** @param {{onRegistered: () => void}} props Переход после регистрации. @returns {object} Экран регистрации. */
export function SignupPage({ onRegistered }: { onRegistered: () => void }) {
    const [state, setState] = useState<FormState>({ errors: {}, message: '', pending: false })

    function readValues(form: HTMLFormElement): SignupValues {
        return {
            display_name: getInput(form, 'display_name').value,
            email: getInput(form, 'email').value,
            password: getInput(form, 'password').value,
        }
    }
    function clearError(event: Event) {
        if (!(event.currentTarget instanceof HTMLInputElement)) return
        const name = event.currentTarget.name
        if (state.errors[name] || state.message)
            setState(previous => ({ ...previous, message: '', errors: { ...previous.errors, [name]: '' } }))
    }
    function validateField(event: FocusEvent) {
        if (!(event.currentTarget instanceof HTMLInputElement)) return
        const { name, form } = event.currentTarget
        if (!form) return
        if (form.dataset.submitting === 'true') return
        const { errors } = validateSignup(readValues(form))
        setState(previous => ({
            ...previous,
            errors: { ...previous.errors, [name]: errors[name as keyof SignupValues] || '' },
        }))
    }
    async function submit(event: SubmitEvent) {
        event.preventDefault()
        const form = event.currentTarget
        if (!(form instanceof HTMLFormElement)) return
        if (form.dataset.submitting === 'true') return
        const { data, errors } = validateSignup(readValues(form))
        if (Object.keys(errors).length) {
            setState({ errors, message: '', pending: false })
            getInput(form, Object.keys(errors)[0]).focus()
            return
        }
        form.dataset.submitting = 'true'
        setState({ errors: {}, message: '', pending: true })
        try {
            await signup(data)
            if (!form.isConnected) return
            getInput(form, 'password').value = ''
            onRegistered()
        } catch (error) {
            if (!form.isConnected) return
            const fields = error instanceof SignupError ? error.fields : {}
            setState({ errors: fields, message: errorMessage(error), pending: false })
            const firstField = Object.keys(fields)[0]
            const input = firstField ? form.elements.namedItem(firstField) : null
            if (input instanceof HTMLInputElement) input.focus()
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
