import { API_URL, API_REQUEST_OPTIONS } from '../../config.js'


export async function requestJson(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...API_REQUEST_OPTIONS,
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        signal: options.signal ?? AbortSignal.timeout(15000),
    })

    const body = await response.json().catch(() => null)

    return { response, body }
}
