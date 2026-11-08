export class NetworkError extends Error {
    constructor() {
        super('Нет соединения с сервером.')
        this.name = 'NetworkError'
    }
}

const listeners = new Set<() => void>()
let available = true

export const connectionAvailable = (): boolean => available
export const isNetworkError = (error: unknown): boolean => error instanceof NetworkError

export function reportConnection(value: boolean): void {
    if (available === value) return
    available = value
    for (const listener of listeners) listener()
}

export function subscribeConnection(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function observeConnection(): () => void {
    const online = () => reportConnection(true)
    const offline = () => reportConnection(false)
    available = window.navigator.onLine !== false
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
        window.removeEventListener('online', online)
        window.removeEventListener('offline', offline)
    }
}
