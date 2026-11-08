import type { FieldErrors } from '../../types/domain.ts'
import type { SignupValues } from './validation.ts'
import { readApiError, requestJson } from '../../shared/api/request.ts'

export class SignupError extends Error {
    fields: FieldErrors
    constructor(message: string, fields: FieldErrors = {}) {
        super(message)
        this.name = 'SignupError'
        this.fields = fields
    }
}

export async function signup(data: SignupValues, request = fetch) {
    let result: Awaited<ReturnType<typeof requestJson>>
    try {
        result = await requestJson('/auth/signup', { method: 'POST', body: JSON.stringify(data) }, request)
    } catch {
        throw new SignupError('Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.')
    }

    const { response, body } = result
    if (response.status === 201) return
    const error = readApiError(body)

    if (response.status === 409 && error.code === 'email_taken') {
        throw new SignupError('', { email: 'Пользователь с таким email уже существует' })
    }
    if (response.status === 400 && error.code === 'validation_failed') {
        const fields: FieldErrors = {}
        for (const key of ['display_name', 'email', 'password']) {
            const message = error.fields[key]
            if (message?.trim()) fields[key] = message
        }
        throw new SignupError(Object.keys(fields).length ? '' : 'Проверьте правильность заполнения полей.', fields)
    }
    throw new SignupError('Не удалось создать аккаунт. Попробуйте ещё раз немного позже.')
}
