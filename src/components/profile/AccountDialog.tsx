import { createElement, useState } from '@navse200/my-react'
import { AccountError, changeAccount } from '../../features/profile/account.ts'
import { validateAccount } from '../../features/profile/validation.ts'
import type { AccountAction, AccountValues } from '../../features/profile/types.ts'
import type { AccountDialogProps, AccountDialogState, AccountField } from './AccountDialog.types.ts'
import { Modal } from '../modal/Modal.tsx'
import { modals } from '../modal/manager.ts'
import './AccountDialog.scss'

const titles: Record<AccountAction, string> = {
    email: 'Изменить e-mail',
    password: 'Сменить пароль',
    delete: 'Удалить аккаунт',
}

const fields: Record<AccountAction, AccountField[]> = {
    email: [
        { name: 'email', label: 'Новый e-mail', type: 'email', autoComplete: 'email' },
        { name: 'current_password', label: 'Текущий пароль', type: 'password', autoComplete: 'current-password' },
    ],
    password: [
        { name: 'current_password', label: 'Текущий пароль', type: 'password', autoComplete: 'current-password' },
        { name: 'new_password', label: 'Новый пароль', type: 'password', autoComplete: 'new-password' },
        { name: 'confirm_password', label: 'Повторите новый пароль', type: 'password', autoComplete: 'new-password' },
    ],
    delete: [{ name: 'current_password', label: 'Текущий пароль', type: 'password', autoComplete: 'current-password' }],
}

export const AccountDialog = ({ action, user, onSuccess, onExpired }: AccountDialogProps) => {
    const [state, setState] = useState<AccountDialogState>({
        values: { email: user.email ?? '', current_password: '', new_password: '', confirm_password: '' },
        errors: {},
        message: '',
        pending: false,
    })

    const change = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement
        const name = input.name as keyof AccountValues
        const value = input.value
        setState(previous => ({
            ...previous,
            values: { ...previous.values, [name]: value },
            errors: { ...previous.errors, [name]: '' },
            message: '',
        }))
    }

    const submit = async (event: SubmitEvent) => {
        event.preventDefault()
        if (state.pending) return
        const form = event.currentTarget as HTMLFormElement
        const { email, errors } = validateAccount(action, state.values)
        if (Object.keys(errors).length) {
            setState(previous => ({ ...previous, errors }))
            const input = form.elements.namedItem(Object.keys(errors)[0]) as HTMLInputElement
            input.focus()
            return
        }
        setState(previous => ({ ...previous, errors: {}, message: '', pending: true }))
        try {
            const values: Record<string, string> = { current_password: state.values.current_password }
            if (action === 'email') values.email = email
            if (action === 'password') values.new_password = state.values.new_password
            const updated = await changeAccount(user, action, values)
            if (!form.isConnected) return
            modals.close()
            onSuccess(updated)
        } catch (error) {
            if (!form.isConnected) return
            if (error instanceof AccountError && error.code === 'unauthorized') {
                onExpired()
                return
            }
            const fieldErrors = error instanceof AccountError ? error.fields : {}
            const hasFieldError = fields[action].some(field => Boolean(fieldErrors[field.name]))
            setState(previous => ({
                ...previous,
                errors: fieldErrors,
                message: hasFieldError
                    ? ''
                    : error instanceof Error
                      ? error.message
                      : 'Не удалось сохранить изменения.',
                pending: false,
            }))
        }
    }

    const renderField = (field: AccountField, index: number) => {
        const id = 'account-' + field.name
        const error = state.errors[field.name]
        return (
            <div className="account-dialog__field" key={field.name}>
                <label className="account-dialog__label" htmlFor={id}>
                    {field.label}
                </label>
                <input
                    className="account-dialog__input"
                    id={id}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    value={state.values[field.name]}
                    autoFocus={index === 0}
                    required
                    disabled={state.pending}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? id + '-error' : undefined}
                    onInput={change}
                />
                <p className="account-dialog__error" id={id + '-error'} role="alert">
                    {error}
                </p>
            </div>
        )
    }

    return (
        <Modal title={titles[action]} busy={state.pending} className="account-dialog">
            <form className="account-dialog__form" noValidate onSubmit={submit} aria-busy={state.pending}>
                {action === 'delete' && (
                    <p className="account-dialog__description">
                        Подтвердите удаление аккаунта текущим паролем. Это действие нельзя отменить.
                    </p>
                )}
                {fields[action].map(renderField)}
                <p className="account-dialog__error" role="alert">
                    {state.message}
                </p>
                <div className="account-dialog__actions">
                    <button
                        className="profile-button profile-button--cancel account-dialog__button"
                        type="button"
                        onClick={modals.close}
                        disabled={state.pending}
                    >
                        Отмена
                    </button>
                    <button
                        className={
                            'profile-button account-dialog__button' +
                            (action === 'delete' ? ' profile-button--delete' : '')
                        }
                        type="submit"
                        disabled={state.pending}
                    >
                        {state.pending ? 'Подождите…' : action === 'delete' ? 'Удалить аккаунт' : 'Сохранить'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
