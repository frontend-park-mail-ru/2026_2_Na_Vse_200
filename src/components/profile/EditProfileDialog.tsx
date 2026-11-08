import { createElement, useState } from '@navse200/my-react'
import { ProfileError, updateProfile } from '../../features/profile/api.ts'
import { validateProfile } from '../../features/profile/validation.ts'
import type { EditProfileDialogProps, EditProfileDialogState } from './EditProfileDialog.types.ts'
import { UserAvatar } from './UserAvatar.tsx'
import { Modal } from '../modal/Modal.tsx'
import { modals } from '../modal/manager.ts'
import './EditProfileDialog.scss'

export const EditProfileDialog = ({ user, onSaved, onUpdated, onExpired }: EditProfileDialogProps) => {
    const [state, setState] = useState<EditProfileDialogState>({
        name: user.display_name ?? '',
        avatar: null,
        preview: '',
        errors: {},
        message: '',
        pending: false,
        reading: false,
    })

    const choosePhoto = (event: MouseEvent) => {
        const button = event.currentTarget as HTMLButtonElement
        const input = button.form!.elements.namedItem('avatar') as HTMLInputElement
        input.click()
    }

    const changeName = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement
        const name = input.value
        setState(previous => ({
            ...previous,
            name,
            message: '',
            errors: { ...previous.errors, display_name: '' },
        }))
    }

    const setPhoto = (avatar: File | null, preview = '', error = '') => {
        setState(previous => ({
            ...previous,
            avatar,
            preview,
            reading: false,
            message: '',
            errors: { ...previous.errors, avatar: error },
        }))
    }

    const selectPhoto = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement
        const file = input.files?.[0]
        if (!file) return
        const { errors } = validateProfile(state.name, file)
        if (errors.avatar) {
            input.value = ''
            setPhoto(null, '', errors.avatar)
            return
        }

        setState(previous => ({ ...previous, reading: true, errors: { ...previous.errors, avatar: '' }, message: '' }))
        const reader = new FileReader()
        reader.onload = () => {
            if (!input.isConnected || input.files?.[0] !== file) return
            setPhoto(file, reader.result as string)
        }
        reader.onerror = () => {
            if (!input.isConnected || input.files?.[0] !== file) return
            input.value = ''
            setPhoto(null, '', 'Не удалось прочитать изображение.')
        }
        reader.readAsDataURL(file)
    }

    const submit = async (event: SubmitEvent) => {
        event.preventDefault()
        const form = event.currentTarget as HTMLFormElement
        if (state.pending || state.reading) return
        const { name, errors } = validateProfile(state.name, state.avatar)
        if (state.errors.avatar) errors.avatar = state.errors.avatar
        if (Object.keys(errors).length) {
            setState(previous => ({ ...previous, errors }))
            if (errors.display_name) {
                const input = form.elements.namedItem('display_name') as HTMLInputElement
                input.focus()
            }
            return
        }

        setState(previous => ({ ...previous, errors: {}, message: '', pending: true }))
        try {
            const updated = await updateProfile(user, name, state.avatar)
            if (!form.isConnected) return
            modals.close()
            onSaved(updated)
        } catch (error) {
            if (!form.isConnected) return
            if (error instanceof ProfileError && error.code === 'unauthorized') {
                onExpired()
                return
            }
            if (error instanceof ProfileError && error.savedUser) onUpdated?.(error.savedUser)
            setState(previous => ({
                ...previous,
                errors: error instanceof ProfileError ? error.fields : {},
                message: error instanceof Error ? error.message : 'Не удалось сохранить профиль.',
                pending: false,
            }))
        }
    }

    return (
        <Modal title="Редактировать профиль" busy={state.pending} className="profile-edit">
            <form
                className="profile-edit__form"
                noValidate
                onSubmit={submit}
                aria-busy={state.pending ? 'true' : 'false'}
            >
                <div className="profile-edit__photo">
                    <UserAvatar src={state.preview || user.avatar_url} className="profile-edit__avatar" />
                    <div>
                        <button className="profile-button" type="button" disabled={state.pending} onClick={choosePhoto}>
                            Изменить фото
                        </button>
                        <p className="profile-edit__hint" id="profile-photo-hint">
                            JPG, PNG или WebP до 2 МБ
                        </p>
                    </div>
                    <input
                        type="file"
                        name="avatar"
                        accept="image/jpeg,image/png,image/webp"
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
                        value={state.name}
                        autoComplete="nickname"
                        autoFocus
                        required
                        disabled={state.pending}
                        aria-invalid={state.errors.display_name ? 'true' : 'false'}
                        aria-describedby={state.errors.display_name ? 'profile-name-error' : undefined}
                        onInput={changeName}
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
                        onClick={modals.close}
                        disabled={state.pending}
                    >
                        Отмена
                    </button>
                    <button className="profile-button" type="submit" disabled={state.pending || state.reading}>
                        {state.pending ? 'Сохраняем…' : 'Сохранить'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
