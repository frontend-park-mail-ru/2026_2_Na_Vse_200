import type { FieldErrors, User } from '../../types/domain.ts'
import { readApiError, isRecord, requestJson } from '../../shared/api/request.ts'

/** Ошибка запроса аутентификации. */
export class AuthError extends Error {
    /** @param {string} message Сообщение для пользователя. @param {object} fields Ошибки полей. @param {string} code Код ошибки API. */
    fields: FieldErrors
    code: string
    constructor(message: string, fields: FieldErrors = {}, code = '') {
        super(message)
        this.name = 'AuthError'
        this.fields = fields
        this.code = code
    }
}

async function requestAuth(path: string, options: RequestInit, request: typeof fetch) {
    try {
        return await requestJson(path, options, request)
    } catch {
        throw new AuthError(
            'Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.',
            {},
            'network_error',
        )
    }
}

/** Текущий пользователь по сессии. При 401 пользователь не вошёл — возвращаем null. */
export async function getCurrentUser(request = fetch) {
    const { response, body } = await requestAuth('/auth/me', { method: 'GET' }, request)
    if (response.status === 200) return parseUser(body)
    if (response.status === 401) return null
    throw new AuthError(
        'Не удалось проверить сессию. Попробуйте обновить страницу.',
        {},
        readApiError(body).code || 'session_error',
    )
}

/** Вход в аккаунт. Cookie сессии с флагом HttpOnly устанавливает сервер. */
export async function login(data: { email: string; password: string }, request = fetch) {
    const { response, body } = await requestAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }, request)
    if (response.status === 200) return parseUser(body)
    if (response.status === 400 && readApiError(body).code === 'validation_failed') {
        throw new AuthError('', readApiError(body).fields || {}, readApiError(body).code)
    }
    if (response.status === 401 && readApiError(body).code === 'invalid_credentials') {
        throw new AuthError('Неверный email или пароль', {}, readApiError(body).code)
    }
    throw new AuthError('Не удалось выполнить вход. Попробуйте ещё раз.', {}, readApiError(body).code || 'login_error')
}

/** Выход из аккаунта. Ждём статус 204. */
export async function logout(request = fetch) {
    const { response, body } = await requestAuth('/auth/logout', { method: 'POST' }, request)
    if (response.status === 204) return
    throw new AuthError(
        'Не удалось выйти из аккаунта. Попробуйте ещё раз.',
        {},
        readApiError(body).code || 'logout_error',
    )
}

function parseUser(body: unknown): User {
    if (
        !isRecord(body) ||
        (body.id !== undefined && typeof body.id !== 'string' && typeof body.id !== 'number') ||
        (body.email !== undefined && typeof body.email !== 'string') ||
        (body.display_name !== undefined && typeof body.display_name !== 'string')
    ) {
        throw new AuthError('Сервер вернул пользователя в неизвестном формате.')
    }
    return { id: body.id, email: body.email, display_name: body.display_name }
}
