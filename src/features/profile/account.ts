import { isRecord, readApiError, requestJson } from '../../shared/api/request.ts'
import type { User } from './types.ts'

export type AccountAction = 'email' | 'password' | 'delete'

export class AccountError extends Error {
    constructor(
        message: string,
        public fields: Partial<Record<string, string>> = {},
        public code = '',
    ) {
        super(message)
    }
}

export async function changeAccount(
    user: User,
    action: AccountAction,
    values: Record<string, string>,
): Promise<User | undefined> {
    const path = `/users/${encodeURIComponent(String(user.id))}${action === 'delete' ? '' : `/${action}`}`
    const { response, body } = await requestJson(path, {
        method: action === 'delete' ? 'DELETE' : 'PUT',
        body: JSON.stringify(values),
    })
    if (response.status === 204 && action !== 'email') return
    if (
        response.status === 200 &&
        action === 'email' &&
        isRecord(body) &&
        body.id === user.id &&
        typeof body.email === 'string' &&
        typeof body.display_name === 'string'
    ) {
        return { ...user, email: body.email, display_name: body.display_name }
    }
    const error = readApiError(body)
    if (response.status === 401) throw new AccountError('Сессия истекла. Войдите снова.', {}, 'unauthorized')
    if (response.status === 409 && error.code === 'email_taken') {
        throw new AccountError('Этот email уже занят.', { email: 'Этот email уже занят.' }, error.code)
    }
    throw new AccountError(
        error.message || 'Не удалось изменить аккаунт. Попробуйте ещё раз.',
        error.fields,
        error.code,
    )
}
