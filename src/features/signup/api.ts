import type { FieldErrors } from '../../types/domain.ts'
import type { SignupValues } from './validation.ts'
import { readApiError, requestJson } from '../../shared/api/request.ts'

/** Ошибка регистрации: общее сообщение и ошибки отдельных полей. */
export class SignupError extends Error {
    /** @param {string} message Текст ошибки. @param {object} fields Ошибки полей. */
    fields: FieldErrors
    constructor(message: string, fields: FieldErrors = {}) {
        super(message)
        this.name = 'SignupError'
        this.fields = fields
    }
}

/**
 * Регистрация без автоматического входа. Логин и пароль локально не сохраняем.
 * @param {{display_name: string, email: string, password: string}} data Данные после валидации.
 * @param {typeof fetch} request fetch или его замена в тестах.
 * @returns {Promise<void>} Успех только при статусе 201.
 */
export async function signup(data: SignupValues, request = fetch) {
    let response
    let body

    try {
        ;({ response, body } = await requestJson(
            '/auth/signup',
            {
                method: 'POST',
                body: JSON.stringify(data),
            },
            request,
        ))
    } catch {
        throw new SignupError('Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.')
    }

    if (response.status === 201) return

    if (response.status === 409 && readApiError(body).code === 'email_taken') {
        throw new SignupError('', { email: 'Пользователь с таким email уже существует' })
    }
    if (response.status === 400 && readApiError(body).code === 'validation_failed') {
        const fields: FieldErrors = {}
        for (const key of ['display_name', 'email', 'password']) {
            const message = readApiError(body).fields?.[key]
            if (typeof message === 'string' && message.trim()) fields[key] = message
        }
        throw new SignupError(Object.keys(fields).length ? '' : 'Проверьте правильность заполнения полей.', fields)
    }
    throw new SignupError('Не удалось создать аккаунт. Попробуйте ещё раз немного позже.')
}
