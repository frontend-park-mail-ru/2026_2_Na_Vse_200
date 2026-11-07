import { isRecord, readApiError, requestJson } from '../../shared/api/request.ts'
import type { FieldErrors, User } from './types.ts'

export class ProfileError extends Error {
    fields: FieldErrors
    code: string
    savedUser?: User

    constructor(message: string, fields: FieldErrors = {}, code = '') {
        super(message)
        this.name = 'ProfileError'
        this.fields = fields
        this.code = code
    }
}

const readProfile = (result: Awaited<ReturnType<typeof requestJson>>): User => {
    const { response, body } = result
    const error = readApiError(body)
    if (
        response.status === 200 &&
        isRecord(body) &&
        typeof body.display_name === 'string' &&
        (typeof body.id === 'string' || typeof body.id === 'number')
    ) {
        return {
            id: body.id,
            display_name: body.display_name,
            email: typeof body.email === 'string' ? body.email : undefined,
            avatar_url: typeof body.avatar_url === 'string' ? body.avatar_url : null,
        }
    }
    if (response.status === 401) {
        throw new ProfileError('Сессия истекла. Войдите снова.', {}, 'unauthorized')
    }
    if (response.status === 400 && error.code === 'validation_failed') {
        throw new ProfileError(error.message || 'Проверьте поля формы.', error.fields)
    }
    if (response.status === 413) {
        throw new ProfileError('', { avatar: 'Файл слишком большой. Выберите изображение меньшего размера.' })
    }
    throw new ProfileError(error.message || 'Не удалось сохранить профиль. Попробуйте ещё раз.')
}

export const updateProfile = async (user: User, name: string, avatar: File | null = null): Promise<User> => {
    const path = `/users/${encodeURIComponent(String(user.id))}`
    let saved: User | undefined
    try {
        // Backend updates text fields and uploads the avatar with separate requests.
        saved = readProfile(await requestJson(path, {
            method: 'PUT',
            body: JSON.stringify({ email: user.email, display_name: name }),
        }))
        if (!avatar) return saved
        const data = new FormData()
        data.append('avatar', avatar)
        return readProfile(await requestJson(`${path}/avatar`, { method: 'POST', body: data, multipart: true }))
    } catch (error) {
        const failure = error instanceof ProfileError
            ? error
            : new ProfileError('Не удалось связаться с сервером. Попробуйте ещё раз.')
        if (saved) {
            failure.savedUser = saved
            failure.message = `Имя сохранено. Фото не обновлено. ${failure.message}`
        }
        throw failure
    }
}
