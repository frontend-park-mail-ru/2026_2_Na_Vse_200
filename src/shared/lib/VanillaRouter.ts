interface RouterOptions {
    routes?: Record<string, string>
}
/** Роутер на History API; перехватывает внутренние ссылки с data-link. */
export class VanillaRouter {
    routes: Record<string, string>
    events: DocumentFragment
    started: boolean
    handleLocationChange: () => void
    handleLinkClick: (event: MouseEvent) => void
    constructor({ routes = {} }: RouterOptions = {}) {
        this.routes = routes
        this.events = document.createDocumentFragment()
        this.started = false
        this.handleLocationChange = () => this.dispatchRoute()
        this.handleLinkClick = event => this.onLinkClick(event)
    }

    /** Подписывается на переходы и сразу сообщает текущий маршрут. */
    listen() {
        if (this.started) return this

        window.addEventListener('popstate', this.handleLocationChange)
        document.addEventListener('click', this.handleLinkClick)
        this.started = true
        this.dispatchRoute()
        return this
    }

    on(eventName: string, listener: EventListener) {
        this.events.addEventListener(eventName, listener)
        return this
    }

    off(eventName: string, listener: EventListener) {
        this.events.removeEventListener(eventName, listener)
        return this
    }

    /**
     * Переходит по адресу и уведомляет подписчиков.
     * @param to Адрес перехода. Внешняя ссылка открывается обычной навигацией браузера.
     * @param options При replace заменяет текущую запись истории.
     */
    navigate(to: string, { replace = false }: { replace?: boolean } = {}) {
        const target = new URL(to, window.location.origin)
        if (target.origin !== window.location.origin) {
            window.location.assign(target.href)
            return this
        }

        const destination = `${target.pathname}${target.search}`
        if (replace) window.history.replaceState({}, '', destination)
        else window.history.pushState({}, '', destination)
        this.dispatchRoute()
        return this
    }

    /** Снимает обработчики, добавленные в listen(). */
    destroy() {
        if (!this.started) return this

        window.removeEventListener('popstate', this.handleLocationChange)
        document.removeEventListener('click', this.handleLinkClick)
        this.started = false
        return this
    }

    dispatchRoute() {
        const url = this.getCurrentUrl()
        const match = this.findRoute(url.pathname)
        this.events.dispatchEvent(
            new CustomEvent('route', {
                detail: {
                    route: match?.value ?? null,
                    path: url.pathname,
                    url,
                    params: match?.params ?? {},
                    query: Object.fromEntries(url.searchParams.entries()),
                    notFound: !match,
                },
            }),
        )
    }

    getCurrentUrl() {
        const url = new URL(window.location.href)
        url.hash = ''
        return url
    }

    findRoute(pathname: string) {
        const path = normalizePath(pathname)

        for (const [pattern, value] of Object.entries(this.routes)) {
            const params = matchPath(pattern, path)
            if (params) return { value, params }
        }

        return null
    }

    onLinkClick(event: MouseEvent) {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return
        }

        const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-link]') : null
        if (!link || link.target || link.hasAttribute('download')) return

        const target = new URL(link.href, window.location.href)
        if (target.origin !== window.location.origin) return

        event.preventDefault()
        this.navigate(target.href)
    }
}

function normalizePath(path: string) {
    if (path === '/') return '/'
    return `/${path.split('/').filter(Boolean).join('/')}`
}

function matchPath(pattern: string, pathname: string) {
    if (pattern === '*') return {}

    const patternParts = normalizePath(pattern).split('/').filter(Boolean)
    const pathParts = pathname.split('/').filter(Boolean)
    const params: Record<string, string> = {}

    if (patternParts.length !== pathParts.length) return null

    for (let index = 0; index < patternParts.length; index++) {
        const expected = patternParts[index]
        const actual = pathParts[index]

        if (expected.startsWith(':')) {
            params[expected.slice(1)] = decodeURIComponent(actual)
        } else if (expected !== actual) {
            return null
        }
    }

    return params
}
