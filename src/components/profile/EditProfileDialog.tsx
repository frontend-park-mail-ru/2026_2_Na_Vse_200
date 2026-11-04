import { createElement, useState } from '../../shared/lib/my-react/index.js'
import { ProfileError, updateProfile } from '../../features/profile/api.ts'
import { validateProfile } from '../../features/profile/validation.ts'
import type { FieldErrors, User } from '../../features/profile/types.ts'
import { UserAvatar } from './UserAvatar.tsx'
import './EditProfileDialog.scss'

interface Props {
    user: User
    onClose: () => void
    onSaved: (user: User) => void
    onExpired: () => void
}

interface State {
    avatar: File | null
    preview: string
    errors: FieldErrors
    message: string
    pending: boolean
    reading: boolean
}

export function EditProfileDialog({ user, onClose, onSaved, onExpired }: Props) {
    const [state, setState] = useState<State>({
        avatar: null,
        preview: '',
        errors: {},
        message: '',
        pending: false,
        reading: false,
    })

    function close(event: Event) {
        if (state.pending) return
        const dialog = (event.currentTarget as HTMLElement).closest('dialog')!
        dialog.close()
    }

    function selectPhoto(event: Event) {
        const input = event.currentTarget as HTMLInputElement
        const file = input.files?.[0]
        if (!file) return
        const { errors } = validateProfile(user.display_name, file)
        if (errors.avatar) {
            input.value = ''
            setState(previous => ({
                ...previous,
                avatar: null,
                preview: '',
                reading: false,
                errors: { ...previous.errors, avatar: errors.avatar },
            }))
            return
        }

        setState(previous => ({ ...previous, reading: true, errors: { ...previous.errors, avatar: '' }, message: '' }))
        const reader = new FileReader()
        reader.onload = () => {
            if (!input.isConnected || input.files?.[0] !== file) return
            setState(previous => ({
                ...previous,
                avatar: file,
                preview: reader.result as string,
                reading: false,
                errors: { ...previous.errors, avatar: '' },
                message: '',
            }))
        }
        reader.onerror = () => {
            if (!input.isConnected || input.files?.[0] !== file) return
            input.value = ''
            setState(previous => ({
                ...previous,
                avatar: null,
                preview: '',
                reading: false,
                errors: { ...previous.errors, avatar: 'Не удалось прочитать изображение.' },
            }))
        }
        reader.readAsDataURL(file)
    }

    async function submit(event: SubmitEvent) {
        event.preventDefault()
        const form = event.currentTarget as HTMLFormElement
        if (form.dataset.submitting === 'true' || state.reading) return
        const field = form.elements.namedItem('display_name') as HTMLInputElement
        const { name, errors } = validateProfile(field.value, state.avatar)
        if (state.errors.avatar) errors.avatar = state.errors.avatar
        if (Object.keys(errors).length) {
            setState(previous => ({ ...previous, errors }))
            if (errors.display_name) field.focus()
            return
        }

        form.dataset.submitting = 'true'
        setState(previous => ({ ...previous, errors: {}, message: '', pending: true }))
        try {
            const updated = await updateProfile(name, state.avatar)
            if (!form.isConnected) return
            form.closest('dialog')!.close()
            onSaved(updated)
        } catch (error) {
            if (!form.isConnected) return
            if (error instanceof ProfileError && error.code === 'unauthorized') {
                onExpired()
                return
            }
            setState(previous => ({
                ...previous,
                errors: error instanceof ProfileError ? error.fields : {},
                message: error instanceof Error ? error.message : 'Не удалось сохранить профиль.',
                pending: false,
            }))
        } finally {
            form.dataset.submitting = 'false'
        }
    }

    return (
        <dialog
            className="profile-edit"
            aria-labelledby="profile-edit-title"
            onCancel={(event: Event) => {
                event.preventDefault()
                close(event)
            }}
            onClose={(event: Event) => {
                if ((event.currentTarget as HTMLDialogElement).isConnected) onClose()
            }}
        >
            <header className="profile-edit__header">
                <h2 id="profile-edit-title">Редактировать профиль</h2>
                <button
                    className="profile-edit__close"
                    type="button"
                    aria-label="Закрыть"
                    onClick={close}
                    disabled={state.pending}
                >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="m4 4 16 16M20 4 4 20" stroke="currentColor" stroke-width="2" />
                    </svg>
                </button>
            </header>
            <form
                className="profile-edit__form"
                noValidate
                onSubmit={submit}
                aria-busy={state.pending ? 'true' : 'false'}
            >
                <div className="profile-edit__photo">
                    <UserAvatar src={state.preview || user.avatar_url} className="profile-edit__avatar" />
                    <div>
                        <button
                            className="profile-button"
                            type="button"
                            disabled={state.pending}
                            onClick={(event: MouseEvent) => {
                                const button = event.currentTarget as HTMLButtonElement
                                const input = button.form!.elements.namedItem('avatar') as HTMLInputElement
                                input.click()
                            }}
                        >
                            Изменить фото
                        </button>
                        <p className="profile-edit__hint" id="profile-photo-hint">
                            JPG или PNG
                        </p>
                    </div>
                    <input
                        type="file"
                        name="avatar"
                        accept="image/jpeg,image/png"
                        aria-label="Фотография профиля"
                        aria-describedby="profile-photo-hint profile-photo-error"
                        disabled={state.pending}
                        onChange={selectPhoto}
                        hidden
                    />
                </div>
                <p className="profile-edit__error" id="profile-photo-error" role="alert">
                    {state.errors.avatar}
                </p>
                <div className="profile-edit__field">
                    <label htmlFor="profile-name">Имя</label>
                    <input
                        id="profile-name"
                        name="display_name"
                        value={user.display_name}
                        autoComplete="nickname"
                        autoFocus
                        required
                        disabled={state.pending}
                        aria-invalid={state.errors.display_name ? 'true' : 'false'}
                        aria-describedby={state.errors.display_name ? 'profile-name-error' : undefined}
                        onInput={() =>
                            setState(previous => ({
                                ...previous,
                                message: '',
                                errors: { ...previous.errors, display_name: '' },
                            }))
                        }
                    />
                    <p className="profile-edit__error" id="profile-name-error" role="alert">
                        {state.errors.display_name}
                    </p>
                </div>
                <p className="profile-edit__error" role="alert">
                    {state.message}
                </p>
                <div className="profile-edit__actions">
                    <button
                        className="profile-button profile-button--cancel"
                        type="button"
                        onClick={close}
                        disabled={state.pending}
                    >
                        Отмена
                    </button>
                    <button className="profile-button" type="submit" disabled={state.pending || state.reading}>
                        {state.pending ? 'Сохраняем…' : 'Сохранить'}
                    </button>
                </div>
            </form>
        </dialog>
    )
}
