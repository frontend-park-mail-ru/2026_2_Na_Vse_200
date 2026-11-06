import { API_URL, API_REQUEST_OPTIONS } from '../../config.js'

export const requestJson = async (path, options = {}) => {
    const { multipart = false, ...config } = options
    const headers = new Headers(config.headers)
    if (!multipart && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    const timeout = AbortSignal.timeout(15000)
    const response = await fetch(`${API_URL}${path}`, {
        ...API_REQUEST_OPTIONS,
        ...config,
        headers,
        signal: config.signal ? AbortSignal.any([config.signal, timeout]) : timeout,
    })
    const body = await response.json().catch(() => null)
    return { response, body }
}
