import { API_URL, API_REQUEST_OPTIONS } from '../../config.ts'

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
export async function requestJson(path: string, options: RequestOptions = {}, request: Fetch = fetch) {
    const { multipart = false, ...config } = options
    const headers = new Headers(config.headers)
    if (!multipart && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    const response = await request(`${API_URL}${path}`, {
        ...API_REQUEST_OPTIONS,
        ...config,
        headers,
        signal: config.signal ?? AbortSignal.timeout(15000),
    })
    const body: unknown = await response.json().catch(() => null)
    return { response, body }
}
