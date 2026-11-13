import type { FieldErrors, User } from '../../types/domain.ts'
import { readApiError, isRecord, requestJson } from '../../shared/api/request.ts'
import { isNetworkError } from '../../shared/offline/network.ts'

export class AuthError extends Error {
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
    } catch (error) {
        if (isNetworkError(error)) throw error
        throw new AuthError(
            'Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.',
            {},
            'network_error',
        )
    }
}

/** Текущий пользователь по сессии. При 401 пользователь не вошёл — возвращаем null. */
export async function getCurrentUser(request = fetch, signal?: AbortSignal) {
    const { response, body } = await requestAuth('/auth/me', { method: 'GET', signal }, request)
    if (response.status === 200) {
        try {
            return await withProfile(parseUser(body), request, signal)
        } catch (error) {
            if (error instanceof AuthError && error.code === 'unauthorized') return null
            throw error
        }
    }
    if (response.status === 401) return null
    throw new AuthError(
        'Не удалось проверить сессию. Попробуйте обновить страницу.',
        {},
        readApiError(body).code || 'session_error',
    )
}

export async function login(data: { email: string; password: string }, request = fetch) {
    const { response, body } = await requestAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }, request)
    if (response.status === 200) return withProfile(parseUser(body), request)
    const error = readApiError(body)
    if (response.status === 400 && error.code === 'validation_failed') {
        throw new AuthError('', error.fields, error.code)
    }
    if (response.status === 401 && error.code === 'invalid_credentials') {
        throw new AuthError('Неверный email или пароль', {}, error.code)
    }
    throw new AuthError('Не удалось выполнить вход. Попробуйте ещё раз.', {}, error.code || 'login_error')
}

export async function logout(request = fetch, signal?: AbortSignal) {
    const { response, body } = await requestAuth('/auth/logout', { method: 'POST', signal }, request)
    if (response.status === 204) return
    throw new AuthError(
        'Не удалось выйти из аккаунта. Попробуйте ещё раз.',
        {},
        readApiError(body).code || 'logout_error',
    )
}

export function parseUser(body: unknown): User {
    if (
        !isRecord(body) ||
        (typeof body.id !== 'string' && typeof body.id !== 'number') ||
        (body.email !== undefined && typeof body.email !== 'string') ||
        typeof body.display_name !== 'string'
    ) {
        throw new AuthError('Сервер вернул пользователя в неизвестном формате.')
    }
    const user: User = { id: body.id, email: body.email, display_name: body.display_name }
    if (body.avatar_url !== undefined) user.avatar_url = typeof body.avatar_url === 'string' ? body.avatar_url : null
    return user
}

const withProfile = async (user: User, request: typeof fetch, signal?: AbortSignal): Promise<User> => {
    if (user.avatar_url) return user
    const path = `/users/${encodeURIComponent(String(user.id))}`
    const { response, body } = await requestAuth(path, { method: 'GET', signal }, request)
    if (response.status === 200) return parseUser(body)
    if (response.status === 401) throw new AuthError('Сессия истекла. Войдите снова.', {}, 'unauthorized')
    throw new AuthError('Не удалось загрузить профиль. Попробуйте ещё раз.', {}, readApiError(body).code)
}
