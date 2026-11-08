import { API_URL, API_REQUEST_OPTIONS } from '../../config.ts'
import { NetworkError, reportConnection } from '../offline/network.ts'

export type Fetch = typeof fetch
export interface RequestOptions extends RequestInit {
    multipart?: boolean
}
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}
export function readApiError(body: unknown) {
    const error = isRecord(body) && isRecord(body.error) ? body.error : {}
    const fields: Partial<Record<string, string>> = {}
    if (isRecord(error.fields)) {
        for (const [key, value] of Object.entries(error.fields)) {
            if (typeof value === 'string') fields[key] = value
        }
    }
    return {
        code: typeof error.code === 'string' ? error.code : '',
        message: typeof error.message === 'string' ? error.message : '',
        fields,
    }
}

let csrfToken = ''
let csrfRequest: Promise<string> | undefined

async function getCSRF(request: Fetch): Promise<string> {
    const cookie =
        typeof document === 'undefined'
            ? undefined
            : document.cookie
                  .split('; ')
                  .find(value => value.startsWith('csrf_token='))
                  ?.slice('csrf_token='.length)
    if (cookie) return cookie
    if (csrfToken) return csrfToken
    if (!csrfRequest) {
        csrfRequest = (async () => {
            const response = await request(`${API_URL}/auth/csrf`, {
                ...API_REQUEST_OPTIONS,
                signal: AbortSignal.timeout(15000),
            })
            const body: unknown = await response.json()
            if (!response.ok || !isRecord(body) || typeof body.csrf_token !== 'string')
                throw new Error('Не удалось подготовить защищённый запрос.')
            csrfToken = body.csrf_token
            return csrfToken
        })().finally(() => {
            csrfRequest = undefined
        })
    }
    return csrfRequest
}

/**
 * Выполняет запрос с cookie сессии и CSRF-токеном для изменяющих операций.
 * @param path Путь относительно /api/v1.
 * @param options Параметры fetch; multipart отключает автоматический Content-Type: application/json.
 * @returns HTTP-ответ и разобранный JSON; пустое тело представлено null.
 */
export async function requestJson(path: string, options: RequestOptions = {}, request: Fetch = fetch) {
    const { multipart = false, ...config } = options
    const headers = new Headers(config.headers)
    if (!multipart && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    let response: Response
    try {
        if (typeof window !== 'undefined' && window.navigator.onLine === false) throw new NetworkError()
        const mutation = !['GET', 'HEAD', 'OPTIONS'].includes((config.method ?? 'GET').toUpperCase())
        if (mutation) headers.set('X-CSRF-Token', await getCSRF(request))
        response = await request(`${API_URL}${path}`, {
            ...API_REQUEST_OPTIONS,
            ...config,
            headers,
            signal: config.signal ?? AbortSignal.timeout(15000),
        })
    } catch (error) {
        if (config.signal?.aborted && config.signal.reason?.name !== 'TimeoutError') throw error
        reportConnection(false)
        throw new NetworkError()
    }
    reportConnection(true)
    const body: unknown = await response.json().catch(() => null)
    if (response.status === 403 && readApiError(body).code === 'csrf_rejected') csrfToken = ''
    if (['/auth/signup', '/auth/login', '/auth/logout'].includes(path)) csrfToken = ''
    return { response, body }
}
