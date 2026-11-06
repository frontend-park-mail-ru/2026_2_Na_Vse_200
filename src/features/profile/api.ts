import { requestJson } from '../../shared/api/request.js'
import type { FieldErrors, User } from './types.ts'

export class ProfileError extends Error {
    fields: FieldErrors
    code: string

    constructor(message: string, fields: FieldErrors = {}, code = '') {
        super(message)
        this.name = 'ProfileError'
        this.fields = fields
        this.code = code
    }
}

export const updateProfile = async (name: string, avatar: File | null = null): Promise<User> => {
    const data = new FormData()
    data.append('display_name', name)
    if (avatar) data.append('avatar', avatar)

    let result
    try {
        result = await requestJson('/users/me', { method: 'PATCH', body: data, multipart: true })
    } catch {
        throw new ProfileError('Не удалось связаться с сервером. Попробуйте ещё раз.')
    }

    const { response, body } = result
    if (response.status === 200 && body?.id && typeof body.display_name === 'string') return body
    if (response.status === 401) {
        throw new ProfileError('Сессия истекла. Войдите снова.', {}, 'unauthorized')
    }
    if (response.status === 400 && body?.error?.code === 'validation_failed') {
        throw new ProfileError(body.error.message || 'Проверьте поля формы.', body.error.fields || {})
    }
    if (response.status === 413) {
        throw new ProfileError('', { avatar: 'Файл слишком большой. Выберите изображение меньшего размера.' })
    }
    throw new ProfileError(body?.error?.message || 'Не удалось сохранить профиль. Попробуйте ещё раз.')
}
