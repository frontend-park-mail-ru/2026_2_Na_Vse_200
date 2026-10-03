import { requestJson } from '../../shared/api/request.js'

/** Ошибка запроса аутентификации. */
export class AuthError extends Error {
    /** @param {string} message Сообщение для пользователя. @param {object} fields Ошибки полей. @param {string} code Код ошибки API. */
    constructor(message, fields = {}, code = '') {
        super(message)
        this.name = 'AuthError'
        this.fields = fields
        this.code = code
    }
}

async function requestAuth(path, options, request) {
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
    if (response.status === 200) return body
    if (response.status === 401) return null
    throw new AuthError(
        'Не удалось проверить сессию. Попробуйте обновить страницу.',
        {},
        body?.error?.code || 'session_error',
    )
}

/** Вход в аккаунт. Cookie сессии с флагом HttpOnly устанавливает сервер. */
export async function login(data, request = fetch) {
    const { response, body } = await requestAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }, request)
    if (response.status === 200) return body
    if (response.status === 400 && body?.error?.code === 'validation_failed') {
        throw new AuthError('', body.error.fields || {}, body.error.code)
    }
    if (response.status === 401 && body?.error?.code === 'invalid_credentials') {
        throw new AuthError('Неверный email или пароль', {}, body.error.code)
    }
    throw new AuthError('Не удалось выполнить вход. Попробуйте ещё раз.', {}, body?.error?.code || 'login_error')
}

/** Выход из аккаунта. Ждём статус 204. */
export async function logout(request = fetch) {
    const { response, body } = await requestAuth('/auth/logout', { method: 'POST' }, request)
    if (response.status === 204) return
    throw new AuthError('Не удалось выйти из аккаунта. Попробуйте ещё раз.', {}, body?.error?.code || 'logout_error')
}
