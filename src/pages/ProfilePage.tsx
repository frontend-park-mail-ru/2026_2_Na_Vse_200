import { createElement, useState } from '@navse200/my-react'
import { UserAvatar } from '../components/profile/UserAvatar.tsx'
import { EditProfileDialog } from '../components/profile/EditProfileDialog.tsx'
import { AccountDialog } from '../components/profile/AccountDialog.tsx'
import { modals } from '../components/modal/manager.ts'
import type { AccountAction, User } from '../features/profile/types.ts'
import type { ProfilePageProps } from './ProfilePage.types.ts'
import './ProfilePage.scss'

export const ProfilePage = ({
    user,
    onUserUpdated,
    onSessionExpired,
    onAccountDeleted,
    onLogout,
    authAction,
}: ProfilePageProps) => {
    const [notice, setNotice] = useState('')

    const edit = () => {
        setNotice('')
        modals.open(
            <EditProfileDialog user={user} onSaved={saved} onUpdated={onUserUpdated} onExpired={onSessionExpired} />,
        )
    }

    const saved = (updated: User) => {
        onUserUpdated(updated)
        setNotice('Профиль сохранён')
    }

    const openAccount = (action: AccountAction) => {
        setNotice('')
        const done = (updated?: User) => {
            if (action === 'delete') {
                onAccountDeleted()
                return
            }
            if (updated) onUserUpdated(updated)
            setNotice(action === 'email' ? 'E-mail изменён' : 'Пароль изменён')
        }
        modals.open(<AccountDialog action={action} user={user} onSuccess={done} onExpired={onSessionExpired} />)
    }
    const editEmail = () => openAccount('email')
    const editPassword = () => openAccount('password')
    const removeAccount = () => openAccount('delete')

    return (
        <section className="profile-page" aria-labelledby="profile-title">
            <h1 id="profile-title">Профиль</h1>
            <div className="profile-page__hero">
                <UserAvatar src={user.avatar_url} className="profile-page__avatar" />
                <h2 className="profile-page__name">{user.display_name}</h2>
                <button className="profile-button" type="button" onClick={edit} disabled={authAction}>
                    Редактировать
                </button>
            </div>
            <p className="profile-page__notice" role="status">
                {notice}
            </p>
            <section className="profile-page__account" aria-labelledby="profile-account-title">
                <h2 id="profile-account-title">Аккаунт</h2>
                <dl className="profile-page__details">
                    <div className="profile-page__row">
                        <dt>E-mail</dt>
                        <dd className="profile-page__value">
                            <span>{user.email}</span>
                            <button
                                className="profile-page__link"
                                type="button"
                                onClick={editEmail}
                                disabled={authAction}
                            >
                                Изменить
                            </button>
                        </dd>
                    </div>
                    <div className="profile-page__row">
                        <dt>Пароль</dt>
                        <dd className="profile-page__value">
                            <span role="img" aria-label="Пароль скрыт">
                                ••••••••••••
                            </span>
                            <button
                                className="profile-page__link"
                                type="button"
                                onClick={editPassword}
                                disabled={authAction}
                            >
                                Сменить пароль
                            </button>
                        </dd>
                    </div>
                </dl>
                <div className="profile-page__actions">
                    <button className="profile-button" type="button" onClick={onLogout} disabled={authAction}>
                        {authAction ? 'Выходим…' : 'Выйти из аккаунта'}
                    </button>
                    <button
                        className="profile-button profile-button--delete"
                        type="button"
                        onClick={removeAccount}
                        disabled={authAction}
                    >
                        Удалить аккаунт
                    </button>
                </div>
            </section>
        </section>
    )
}
