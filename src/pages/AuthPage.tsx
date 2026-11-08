import { createElement, useState } from '@navse200/my-react'
import { AuthError, login } from '../features/auth/api.ts'
import { SignupError, signup } from '../features/signup/api.ts'
import { validateLogin } from '../features/auth/validation.ts'
import { validateSignup } from '../features/signup/validation.ts'
import { errorMessage } from '../shared/lib/forms.ts'
import { FormField } from '../components/ui/FormField.tsx'
import type { FormFieldProps } from '../components/ui/FormField.types.ts'
import type { FieldErrors, FormState } from '../types/domain.ts'
import type { AuthPageProps } from './AuthPage.types.ts'
import logo from '../assets/2une-dark-transparent.png'
import './AuthPage.scss'

export const AuthPage = (props: AuthPageProps) => {
    const registration = props.mode === 'signup'
    const title = registration ? 'Регистрация' : 'Вход'
    const submitText = registration ? 'Создать аккаунт' : 'Войти'
    const pendingText = registration ? 'Создаём аккаунт…' : 'Входим…'
    const [state, setState] = useState<FormState>({ message: '', errors: {}, pending: false })
    const fields: FormFieldProps[] = [
        {
            name: 'email',
            label: 'Электронная почта',
            type: 'email',
            placeholder: registration ? 'электронная почта' : 'почта',
            autoComplete: registration ? 'email' : 'username',
        },
        {
            name: 'password',
            label: 'Пароль',
            type: 'password',
            placeholder: 'пароль',
            autoComplete: registration ? 'new-password' : 'current-password',
        },
    ]
    if (registration)
        fields.unshift({ name: 'display_name', label: 'Имя', placeholder: 'имя', autoComplete: 'nickname' })

    const validate = (form: HTMLFormElement) => {
        const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? ''
        const values = { display_name: value('display_name'), email: value('email'), password: value('password') }
        const result = registration ? validateSignup(values) : validateLogin(values)
        const errors: FieldErrors = result.errors
        return { data: { ...values, ...result.data }, errors }
    }
    const clearError = (event: Event) => {
        const name = (event.currentTarget as HTMLInputElement).name
        if (state.errors[name] || state.message) {
            setState(previous => ({ ...previous, message: '', errors: { ...previous.errors, [name]: '' } }))
        }
    }
    const validateField = (event: FocusEvent) => {
        if (state.pending) return
        const input = event.currentTarget as HTMLInputElement
        const { errors } = validate(input.form!)
        setState(previous => ({ ...previous, errors: { ...previous.errors, [input.name]: errors[input.name] || '' } }))
    }
    const submit = async (event: SubmitEvent) => {
        event.preventDefault()
        if (state.pending) return
        const form = event.currentTarget as HTMLFormElement
        const { data, errors } = validate(form)
        if (Object.keys(errors).length) {
            setState({ errors, message: registration ? '' : 'Проверьте email или пароль', pending: false })
            const input = form.elements.namedItem(Object.keys(errors)[0]) as HTMLInputElement
            input.focus()
            return
        }
        setState({ errors: {}, message: '', pending: true })
        try {
            if (props.mode === 'signup') {
                await signup(data)
                if (!form.isConnected) return
                const password = form.elements.namedItem('password') as HTMLInputElement
                password.value = ''
                props.onRegistered()
            } else {
                const user = await login({ email: data.email, password: data.password })
                if (form.isConnected) props.onAuthenticated?.(user)
            }
        } catch (error) {
            if (!form.isConnected) return
            const errors = error instanceof AuthError || error instanceof SignupError ? error.fields : {}
            setState({ errors, message: errorMessage(error), pending: false })
            if (registration && Object.keys(errors).length) {
                const input = form.elements.namedItem(Object.keys(errors)[0]) as HTMLInputElement
                input.focus()
            }
        }
    }
    const renderField = (field: FormFieldProps) => (
        <FormField
            {...field}
            key={field.name}
            idPrefix={props.mode}
            error={state.errors[field.name]}
            onInput={clearError}
            onBlur={validateField}
            disabled={state.pending}
        />
    )
    const feedback = (
        <p className="auth-page__feedback" role="alert">
            {state.message}
        </p>
    )

    return (
        <section className="auth-page" aria-labelledby={`${props.mode}-title`}>
            <aside
                className="auth-page__art"
                aria-label={registration ? 'Музыка под настроение, каждый день' : undefined}
            >
                <img className="auth-page__logo" src={logo} alt="2une tune" />
                <p className="auth-page__slogan">
                    {registration ? 'Музыка' : 'Слушай'}
                    <br />
                    {registration ? 'под твое' : 'Сохраняй'}
                    <br />
                    {registration ? 'настроение' : 'Открывай новое'}
                </p>
            </aside>
            <div className="auth-page__panel">
                <div className="auth-page__content">
                    <h1 className="auth-page__title" id={`${props.mode}-title`} tabIndex={-1}>
                        {title}
                    </h1>
                    <p className="auth-page__intro">
                        {registration
                            ? 'Пара секунд — и можно слушать.'
                            : ['С возвращением! ', <br />, 'Войдите, чтобы продолжить слушать.']}
                    </p>
                    {props.mode === 'login' && props.notice && (
                        <p className="auth-page__notice" role="status">
                            {props.notice}
                        </p>
                    )}
                    <form
                        className={`auth-page__form${registration ? '' : ' auth-page__form--login'}`}
                        noValidate
                        onSubmit={submit}
                        aria-busy={state.pending ? 'true' : 'false'}
                    >
                        {!registration && feedback}
                        {fields.map(renderField)}
                        {registration && feedback}
                        <button className="auth-page__submit" type="submit" disabled={state.pending}>
                            {state.pending ? pendingText : submitText}
                        </button>
                    </form>
                    <p className="auth-page__switch">
                        {registration ? 'Уже есть аккаунт? ' : 'Нет аккаунта? '}
                        <a className="auth-page__switch-link" href={registration ? '/login' : '/signup'} data-link>
                            {registration ? 'Войти' : 'Зарегистрироваться'}
                        </a>
                    </p>
                </div>
            </div>
        </section>
    )
}
