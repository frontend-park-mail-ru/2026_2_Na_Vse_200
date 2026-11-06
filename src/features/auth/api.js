import { requestJson } from '../../shared/api/request.js'

export class AuthError extends Error {
    constructor(message, fields = {}, code = '') {
        super(message)
        this.name = 'AuthError'
        this.fields = fields
        this.code = code
    }
}
const requestAuth = async (path, options) => {
    try {
        return await requestJson(path, options)
    } catch {
        throw new AuthError(
            'Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.',
            {},
            'network_error',
        )
    }
}
export const getCurrentUser = async signal => {
    const { response, body } = await requestAuth('/auth/me', { method: 'GET', signal })
    if (response.status === 200) return body
    if (response.status === 401) return null
    const error = body?.error
    throw new AuthError(
        'Не удалось проверить сессию. Попробуйте обновить страницу.',
        {},
        error?.code || 'session_error',
    )
}
export const login = async data => {
    const { response, body } = await requestAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) })
    if (response.status === 200) return body
    const error = body?.error
    if (response.status === 400 && error?.code === 'validation_failed')
        throw new AuthError('', error.fields || {}, error.code)
    if (response.status === 401 && error?.code === 'invalid_credentials')
        throw new AuthError('Неверный email или пароль', {}, error.code)
    throw new AuthError('Не удалось выполнить вход. Попробуйте ещё раз.', {}, error?.code || 'login_error')
}
export const logout = async signal => {
    const { response, body } = await requestAuth('/auth/logout', { method: 'POST', signal })
    if (response.status === 204) return
    const error = body?.error
    throw new AuthError('Не удалось выйти из аккаунта. Попробуйте ещё раз.', {}, error?.code || 'logout_error')
}
