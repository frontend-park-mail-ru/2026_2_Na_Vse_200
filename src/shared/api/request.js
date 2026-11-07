import { API_URL, API_REQUEST_OPTIONS } from '../../config.js'
import { NetworkError, reportConnection } from '../offline/network.ts'

export async function requestJson(path, options = {}) {
    let response
    try {
        if (typeof window !== 'undefined' && window.navigator.onLine === false) throw new NetworkError()
        response = await fetch(`${API_URL}${path}`, {
            ...API_REQUEST_OPTIONS,
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            signal: options.signal ?? AbortSignal.timeout(15000),
        })
    } catch (error) {
        if (options.signal?.aborted) throw error
        reportConnection(false)
        throw new NetworkError()
    }
    reportConnection(true)

    const body = await response.json().catch(() => null)

    return { response, body }
}
