import { createElement, useState } from '@navse200/my-react'
import { AccountError, changeAccount } from '../../features/profile/account.ts'
import type { AccountAction } from '../../features/profile/account.ts'
import type { User } from '../../features/profile/types.ts'
import { Modal } from '../modal/Modal.tsx'
import { modals } from '../modal/manager.ts'
import './EditProfileDialog.scss'

interface Props {
    user: User
    action: AccountAction
    onSaved: (user: User) => void
    onExpired: () => void
    onClosed: (message: string) => void
}

const titles = { email: 'Сменить email', password: 'Сменить пароль', delete: 'Удалить аккаунт' }

export function AccountDialog({ user, action, onSaved, onExpired, onClosed }: Props) {
    const [state, setState] = useState({ pending: false, message: '', fields: {} as Partial<Record<string, string>> })
    const submit = async (event: SubmitEvent) => {
        event.preventDefault()
        if (state.pending) return
        const form = event.currentTarget as HTMLFormElement
        const data = new FormData(form)
        const values: Record<string, string> = { current_password: String(data.get('current_password') ?? '') }
        if (action === 'email') values.email = String(data.get('email') ?? '')
        if (action === 'password') {
            values.new_password = String(data.get('new_password') ?? '')
            if (values.new_password !== String(data.get('confirm_password') ?? '')) {
                setState({ pending: false, message: '', fields: { confirm_password: 'Пароли не совпадают' } })
                return
            }
        }
        setState({ pending: true, message: '', fields: {} })
        try {
            const updated = await changeAccount(user, action, values)
            modals.close()
            if (updated) onSaved(updated)
            else onClosed(action === 'delete' ? 'Аккаунт удалён.' : 'Пароль изменён. Войдите с новым паролем.')
        } catch (error) {
            if (!form.isConnected) return
            if (error instanceof AccountError && error.code === 'unauthorized') {
                onExpired()
                return
            }
            setState({
                pending: false,
                message: error instanceof Error ? error.message : 'Не удалось изменить аккаунт.',
                fields: error instanceof AccountError ? error.fields : {},
            })
        }
    }
    const fields = [
        ...(action === 'email' ? [{ name: 'email', label: 'Новый email', type: 'email', autoComplete: 'email' }] : []),
        { name: 'current_password', label: 'Текущий пароль', type: 'password', autoComplete: 'current-password' },
        ...(action === 'password'
            ? [
                  { name: 'new_password', label: 'Новый пароль', type: 'password', autoComplete: 'new-password' },
                  {
                      name: 'confirm_password',
                      label: 'Повторите новый пароль',
                      type: 'password',
                      autoComplete: 'new-password',
                  },
              ]
            : []),
    ]
    return (
        <Modal title={titles[action]} busy={state.pending} className="profile-edit">
            <form className="profile-edit__form" onSubmit={submit} aria-busy={state.pending ? 'true' : 'false'}>
                {action === 'delete' && (
                    <p>
                        Аккаунт, плейлисты, избранное и история прослушиваний будут удалены. Это действие нельзя
                        отменить.
                    </p>
                )}
                {action === 'password' && (
                    <p>
                        От 8 символов, хотя бы одна буква и цифра, не более 72 байт. После сохранения потребуется войти
                        снова.
                    </p>
                )}
                {fields.map(field => (
                    <div className="profile-edit__field" key={field.name}>
                        <label htmlFor={`account-${field.name}`}>{field.label}</label>
                        <input
                            id={`account-${field.name}`}
                            name={field.name}
                            type={field.type === 'email' ? 'email' : 'password'}
                            autoComplete={field.autoComplete}
                            required
                            disabled={state.pending}
                            aria-invalid={state.fields[field.name] ? 'true' : 'false'}
                            aria-describedby={state.fields[field.name] ? `account-${field.name}-error` : undefined}
                        />
                        <p className="profile-edit__error" id={`account-${field.name}-error`} role="alert">
                            {state.fields[field.name]}
                        </p>
                    </div>
                ))}
                <p className="profile-edit__error" role="alert">
                    {state.message}
                </p>
                <div className="profile-edit__actions">
                    <button
                        className="profile-button profile-button--cancel"
                        type="button"
                        onClick={modals.close}
                        disabled={state.pending}
                    >
                        Отмена
                    </button>
                    <button
                        className={`profile-button${action === 'delete' ? ' profile-button--delete' : ''}`}
                        type="submit"
                        disabled={state.pending}
                    >
                        {state.pending ? 'Сохраняем…' : titles[action]}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
