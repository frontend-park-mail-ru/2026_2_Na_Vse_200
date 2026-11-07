import { createElement, useState } from '@navse200/my-react'
import { AccountDialog } from '../components/profile/AccountDialog.tsx'
import type { AccountAction } from '../features/profile/account.ts'
import { UserAvatar } from '../components/profile/UserAvatar.tsx'
import { EditProfileDialog } from '../components/profile/EditProfileDialog.tsx'
import { modals } from '../components/modal/manager.ts'
import type { User } from '../features/profile/types.ts'
import type { ProfilePageProps } from './ProfilePage.types.ts'
import './ProfilePage.scss'

export const ProfilePage = ({
    user,
    onUserUpdated,
    onSessionExpired,
    onLogout,
    authAction,
    onAccountClosed,
}: ProfilePageProps) => {
    const [notice, setNotice] = useState('')

    const account = (action: AccountAction) => {
        setNotice('')
        modals.open(
            <AccountDialog
                user={user}
                action={action}
                onSaved={saved}
                onExpired={onSessionExpired}
                onClosed={onAccountClosed}
            />,
        )
    }

    const edit = () => {
        setNotice('')
        modals.open(<EditProfileDialog user={user} onSaved={saved} onExpired={onSessionExpired} />)
    }

    const saved = (updated: User) => {
        onUserUpdated(updated)
        setNotice('Профиль сохранён')
    }

    return (
        <section className="profile-page" aria-labelledby="profile-title">
            <h1 id="profile-title">Профиль</h1>
            <div className="profile-page__hero">
                <UserAvatar src={user.avatar_url} className="profile-page__avatar" />
                <h2 className="profile-page__name">{user.display_name}</h2>
                <button className="profile-button" type="button" onClick={edit}>
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
                        <dd>
                            {user.email}{' '}
                            <button
                                className="profile-page__link"
                                type="button"
                                onClick={() => account('email')}
                                disabled={authAction}
                            >
                                Сменить email
                            </button>
                        </dd>
                    </div>
                    <div className="profile-page__row">
                        <dt>Пароль</dt>
                        <dd className="profile-page__password">
                            <span role="img" aria-label="Пароль скрыт">
                                ••••••••••••
                            </span>
                            <button
                                className="profile-page__link"
                                type="button"
                                disabled={authAction}
                                onClick={() => account('password')}
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
                        disabled={authAction}
                        onClick={() => account('delete')}
                    >
                        Удалить аккаунт
                    </button>
                </div>
            </section>
        </section>
    )
}
