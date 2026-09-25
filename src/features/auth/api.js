import { API_URL, API_REQUEST_OPTIONS } from '../../config.js';

/** Error returned by an authentication request. */
export class AuthError extends Error {
    /** @param {string} message User-facing message. @param {object} fields Field errors. @param {string} code API code. */
    constructor(message, fields = {}, code = '') {
        super(message);
        this.name = 'AuthError';
        this.fields = fields;
        this.code = code;
    }
}

async function requestJson(path, options = {}, request = fetch) {
    let response;
    try {
        response = await request(`${API_URL}${path}`, {
            ...API_REQUEST_OPTIONS,
            ...options,
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            signal: AbortSignal.timeout(15000),
        });
    } catch {
        throw new AuthError('Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.', {}, 'network_error');
    }
    const body = await response.json().catch(() => null);
    return { response, body };
}

/** Read the current user from the server session. A 401 is a normal guest state. */
export async function getCurrentUser(request = fetch) {
    const { response, body } = await requestJson('/auth/me', { method: 'GET' }, request);
    if (response.status === 200) return body;
    if (response.status === 401) return null;
    throw new AuthError('Не удалось проверить сессию. Попробуйте обновить страницу.', {}, body?.error?.code || 'session_error');
}

/** Log in and return the user; the server sets the HttpOnly session cookie. */
export async function login(data, request = fetch) {
    const { response, body } = await requestJson('/auth/login', { method: 'POST', body: JSON.stringify(data) }, request);
    if (response.status === 200) return body;
    if (response.status === 400 && body?.error?.code === 'validation_failed') {
        throw new AuthError('', body.error.fields || {}, body.error.code);
    }
    if (response.status === 401 && body?.error?.code === 'invalid_credentials') {
        throw new AuthError('Неверный email или пароль', {}, body.error.code);
    }
    throw new AuthError('Не удалось выполнить вход. Попробуйте ещё раз.', {}, body?.error?.code || 'login_error');
}

/** End the server session. A 204 is the only successful result. */
export async function logout(request = fetch) {
    const { response, body } = await requestJson('/auth/logout', { method: 'POST' }, request);
    if (response.status === 204) return;
    throw new AuthError('Не удалось выйти из аккаунта. Попробуйте ещё раз.', {}, body?.error?.code || 'logout_error');
}
