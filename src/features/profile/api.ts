import { isRecord, readApiError, requestJson } from '../../shared/api/request.ts'
import type { RequestOptions } from '../../shared/api/request.ts'
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

const userPath = (user: User) => '/users/' + encodeURIComponent(String(user.id))

const responseError = (result: Awaited<ReturnType<typeof requestJson>>, fallback: string): ProfileError => {
    const { response, body } = result
    const error = readApiError(body)
    if (error.code === 'invalid_password' || error.code === 'invalid_credentials') {
        return new ProfileError('', { current_password: 'Неверный текущий пароль' })
    }
    if (response.status === 401) {
        return new ProfileError('Сессия истекла. Войдите снова.', {}, 'unauthorized')
    }
    if (response.status === 400 && error.code === 'validation_failed') {
        return new ProfileError(error.message || 'Проверьте поля формы.', error.fields)
    }
    if (response.status === 409 && error.code === 'email_taken') {
        return new ProfileError('', { email: 'Этот e-mail уже используется' })
    }
    if (response.status === 413) {
        return new ProfileError('', { avatar: 'Файл слишком большой. Выберите изображение меньшего размера.' })
    }
    if (response.status === 404 || response.status === 405) {
        return new ProfileError(fallback, {}, 'unavailable')
    }
    return new ProfileError(error.message || fallback, {}, error.code)
}

const requestProfile = async (path: string, options: RequestOptions) => {
    try {
        return await requestJson(path, options)
    } catch {
        throw new ProfileError('Не удалось связаться с сервером. Попробуйте ещё раз.')
    }
}

const readProfile = (result: Awaited<ReturnType<typeof requestJson>>): User => {
    const { response, body } = result
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
    throw responseError(result, 'Не удалось сохранить профиль. Попробуйте ещё раз.')
}

/**
 * Сохраняет имя и загружает аватар отдельным multipart-запросом.
 * При ошибке загрузки ProfileError.savedUser содержит уже сохранённый профиль.
 */
export const updateProfile = async (user: User, name: string, avatar: File | null = null): Promise<User> => {
    const path = userPath(user)
    let saved: User | undefined
    try {
        if (name !== user.display_name) {
            saved = readProfile(
                await requestProfile(path, {
                    method: 'PUT',
                    body: JSON.stringify({ email: user.email, display_name: name }),
                }),
            )
        }
        if (!avatar) return saved ?? user
        const data = new FormData()
        data.append('avatar', avatar)
        return readProfile(await requestProfile(path + '/avatar', { method: 'POST', body: data, multipart: true }))
    } catch (error) {
        const failure = error instanceof ProfileError ? error : new ProfileError('Не удалось сохранить профиль.')
        if (saved) {
            failure.savedUser = saved
            failure.message = 'Имя сохранено. Фото не обновлено. ' + failure.message
        }
        throw failure
    }
}
