import { createElement, useState } from '../shared/lib/my-react/index.js'
import { UserAvatar } from '../components/profile/UserAvatar.tsx'
import { EditProfileDialog } from '../components/profile/EditProfileDialog.tsx'
import type { User } from '../features/profile/types.ts'
import './ProfilePage.scss'

interface Props {
    user: User
    onUserUpdated: (user: User) => void
    onSessionExpired: () => void
    onLogout: () => void
    authAction: boolean
}

export function ProfilePage({ user, onUserUpdated, onSessionExpired, onLogout, authAction }: Props) {
    const [editing, setEditing] = useState(false)
    const [notice, setNotice] = useState('')

    function edit(event: MouseEvent) {
        const page = (event.currentTarget as HTMLElement).closest('.profile-page')!
        setNotice('')
        setEditing(true)
        page.querySelector('dialog')!.showModal()
    }

    function saved(updated: User) {
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
                        <dd>{user.email}</dd>
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
                                disabled
                                title="Смена пароля пока недоступна"
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
                        disabled
                        title="Удаление аккаунта пока недоступно"
                    >
                        Удалить аккаунт
                    </button>
                </div>
            </section>
            {editing && (
                <EditProfileDialog
                    user={user}
                    onClose={() => setEditing(false)}
                    onSaved={saved}
                    onExpired={onSessionExpired}
                />
            )}
        </section>
    )
}
