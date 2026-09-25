"use strict";

/** Client-side router using History API or URL hashes, with delegated link handling. */
export class VanillaRouter {
    /** @param {{type?: string, routes?: Object<string, string>, root?: string}} options Routing settings. */
    constructor({ type = "history", routes = {}, root = "/" } = {}) {
        if (!["history", "hash"].includes(type)) {
            throw new Error(`Unsupported router type: ${type}`)
        }

        this.type = type
        this.routes = routes
        this.root = root
        this.events = document.createDocumentFragment()
        this.started = false
        this.handleLocationChange = () => this.dispatchRoute()
        this.handleLinkClick = (event) => this.onLinkClick(event)
    }

    /** @returns {VanillaRouter} Start listening and emit the initial route once. */
    listen() {
        if (this.started) return this

        const eventName = this.type === "hash" ? "hashchange" : "popstate"
        window.addEventListener(eventName, this.handleLocationChange)
        document.addEventListener("click", this.handleLinkClick)
        this.started = true
        this.dispatchRoute()
        return this
    }

    /** @param {string} eventName Event name. @param {EventListener} listener Callback. @returns {VanillaRouter} */
    on(eventName, listener) {
        this.events.addEventListener(eventName, listener)
        return this
    }

    /** @param {string} eventName Event name. @param {EventListener} listener Callback. @returns {VanillaRouter} */
    off(eventName, listener) {
        this.events.removeEventListener(eventName, listener)
        return this
    }

    /** @param {string} to Destination URL. @param {{replace?: boolean}} options History behavior. @returns {VanillaRouter} */
    navigate(to, { replace = false } = {}) {
        const target = new URL(to, window.location.origin)
        if (target.origin !== window.location.origin) {
            window.location.assign(target.href)
            return this
        }

        if (this.type === "hash") {
            const hash = target.hash.startsWith("#/")
                ? target.hash.slice(1)
                : `${target.pathname}${target.search}${target.hash}`
            if (window.location.hash === `#${hash}`) this.dispatchRoute()
            else if (replace) window.location.replace(`#${hash}`)
            else window.location.hash = hash
            return this
        }

        const destination = `${target.pathname}${target.search}${target.hash}`
        if (replace) window.history.replaceState({}, "", destination)
        else window.history.pushState({}, "", destination)
        this.dispatchRoute()
        return this
    }

    /** @returns {VanillaRouter} Remove all browser listeners installed by listen(). */
    destroy() {
        if (!this.started) return this

        const eventName = this.type === "hash" ? "hashchange" : "popstate"
        window.removeEventListener(eventName, this.handleLocationChange)
        document.removeEventListener("click", this.handleLinkClick)
        this.started = false
        return this
    }

    dispatchRoute() {
        const url = this.getCurrentUrl()
        const match = this.findRoute(url.pathname)
        this.events.dispatchEvent(new CustomEvent("route", {
            detail: {
                route: match?.value ?? null,
                path: url.pathname,
                url,
                params: match?.params ?? {},
                query: Object.fromEntries(url.searchParams.entries()),
                notFound: !match
            }
        }))
    }

    getCurrentUrl() {
        if (this.type === "history") return new URL(window.location.href)

        const hashPath = window.location.hash.slice(1) || this.root
        return new URL(hashPath.startsWith("/") ? hashPath : `/${hashPath}`, window.location.origin)
    }

    findRoute(pathname) {
        const path = normalizePath(pathname)

        for (const [pattern, value] of Object.entries(this.routes)) {
            const params = matchPath(pattern, path)
            if (params) return { value, params }
        }

        return null
    }

    onLinkClick(event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return
        }

        const link = event.target?.closest?.("a[data-link]")
        if (!link || link.target || link.hasAttribute("download")) return

        const target = new URL(link.href, window.location.href)
        if (target.origin !== window.location.origin) return

        event.preventDefault()
        this.navigate(target.href)
    }
}

function normalizePath(path) {
    if (path === "/") return "/"
    return `/${path.split("/").filter(Boolean).join("/")}`
}

function matchPath(pattern, pathname) {
    if (pattern === "*") return {}

    const patternParts = normalizePath(pattern).split("/").filter(Boolean)
    const pathParts = pathname.split("/").filter(Boolean)
    const params = {}

    if (patternParts.length !== pathParts.length) return null

    for (let index = 0; index < patternParts.length; index++) {
        const expected = patternParts[index]
        const actual = pathParts[index]

        if (expected.startsWith(":")) {
            params[expected.slice(1)] = decodeURIComponent(actual)
        } else if (expected !== actual) {
            return null
        }
    }

    return params
}
