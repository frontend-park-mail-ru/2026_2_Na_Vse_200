import { API_URL, API_REQUEST_OPTIONS } from '../../config.js';

/** Signup failure with user-facing text and optional field errors. */
export class SignupError extends Error {
    /** @param {string} message User-facing error. @param {object} fields Field errors. */
    constructor(message, fields = {}) {
        super(message);
        this.name = 'SignupError';
        this.fields = fields;
    }
}

/**
 * Register without logging in. Credentials are never persisted locally.
 * @param {{display_name: string, email: string, password: string}} data Validated fields.
 * @param {typeof fetch} request Fetch implementation, injectable for tests.
 * @returns {Promise<void>} Resolves only for HTTP 201.
 */
export async function signup(data, request = fetch) {
    let response;
    try {
        response = await request(`${API_URL}/auth/signup`, {
            ...API_REQUEST_OPTIONS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data), signal: AbortSignal.timeout(15000),
        });
    } catch {
        throw new SignupError('Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.');
    }
    if (response.status === 201) return;
    const body = await response.json().catch(() => null);
    if (response.status === 409 && body?.error?.code === 'email_taken') {
        throw new SignupError('', { email: 'Пользователь с таким email уже существует' });
    }
    if (response.status === 400 && body?.error?.code === 'validation_failed') {
        const fields = {};
        for (const key of ['display_name', 'email', 'password']) {
            const message = body.error.fields?.[key];
            if (typeof message === 'string' && message.trim()) fields[key] = message;
        }
        throw new SignupError(Object.keys(fields).length ? '' : 'Проверьте правильность заполнения полей.', fields);
    }
    throw new SignupError('Не удалось создать аккаунт. Попробуйте ещё раз немного позже.');
}
