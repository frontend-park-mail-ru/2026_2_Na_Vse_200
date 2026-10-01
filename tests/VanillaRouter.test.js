'use strict'

import test from 'node:test'
import assert from 'node:assert/strict'
import { VanillaRouter } from '../src/shared/lib/VanillaRouter.js'
import { createAppRouter } from '../src/app/router.js'

class DetailEvent extends Event {
    constructor(type, { detail } = {}) {
        super(type)
        this.detail = detail
    }
}

let currentUrl = new URL('http://localhost/')
const fakeWindow = new EventTarget()
const fakeDocument = new EventTarget()
globalThis.CustomEvent = DetailEvent
globalThis.document = Object.assign(fakeDocument, {
    createDocumentFragment: () => new EventTarget(),
})
Object.defineProperty(fakeWindow, 'location', {
    get() {
        return {
            href: currentUrl.href,
            origin: currentUrl.origin,
            pathname: currentUrl.pathname,
            search: currentUrl.search,
            get hash() {
                return currentUrl.hash
            },
            assign: href => {
                currentUrl = new URL(href)
            },
            replace: href => {
                currentUrl = new URL(href, currentUrl)
                fakeWindow.dispatchEvent(new Event('hashchange'))
            },
            set hash(value) {
                currentUrl.hash = value
                fakeWindow.dispatchEvent(new Event('hashchange'))
            },
        }
    },
})
fakeWindow.history = {
    pushState: (_state, _title, url) => {
        currentUrl = new URL(url, currentUrl)
    },
    replaceState: (_state, _title, url) => {
        currentUrl = new URL(url, currentUrl)
    },
}
globalThis.window = fakeWindow

test('history router emits route details and matches named parameters', () => {
    currentUrl = new URL('http://localhost/')
    const router = new VanillaRouter({
        routes: { '/': 'home', '/users/:id': 'user', '*': 'not-found' },
    })
    const events = []
    router.on('route', event => events.push(event.detail)).listen()

    assert.equal(events.at(-1).route, 'home')
    router.navigate('/users/42?tab=posts')
    assert.equal(events.at(-1).route, 'user')
    assert.equal(events.at(-1).params.id, '42')
    assert.equal(events.at(-1).query.tab, 'posts')

    router.navigate('/missing')
    assert.equal(events.at(-1).route, 'not-found')
    router.destroy()
})

test('hash router reads routes from the URL fragment', () => {
    currentUrl = new URL('http://localhost/#/about')
    const router = new VanillaRouter({
        type: 'hash',
        routes: { '/about': 'about', '/users/:id': 'user' },
    })
    const routes = []
    router.on('route', event => routes.push(event.detail)).listen()

    assert.equal(routes.at(-1).route, 'about')
    assert.equal(routes.at(-1).path, '/about')
    router.navigate('#/users/42')
    assert.equal(routes.at(-1).route, 'user')
    assert.equal(routes.at(-1).params.id, '42')
    router.destroy()
})

test('router rejects unsupported modes', () => {
    assert.throws(() => new VanillaRouter({ type: 'memory' }), /Unsupported router type/)
})

test('app routes support direct entry, navigation, trailing slash and browser history', () => {
    for (const [path, expected] of [
        ['/', 'home'],
        ['/signup', 'signup'],
        ['/login', 'login'],
        ['/unknown/nested', 'not-found'],
    ]) {
        currentUrl = new URL(path, 'http://localhost')
        const router = createAppRouter()
        const events = []
        router
            .on('route', event => events.push(event.detail))
            .listen()
            .listen()
        assert.equal(events.length, 1, 'listen is idempotent')
        assert.equal(events.at(-1).route, expected)
        router.navigate('/login/?next=home')
        assert.equal(events.at(-1).route, 'login')
        currentUrl = new URL(path, 'http://localhost')
        fakeWindow.dispatchEvent(new Event('popstate'))
        assert.equal(events.at(-1).route, expected)
        router.destroy()
        const count = events.length
        fakeWindow.dispatchEvent(new Event('popstate'))
        assert.equal(events.length, count, 'destroy removes listeners')
    }
})

test('link interception preserves browser shortcuts, targets, downloads and external links', () => {
    const router = createAppRouter()
    const destinations = []
    router.navigate = to => destinations.push(to)
    const link = { href: 'http://localhost/signup', target: '', hasAttribute: () => false }
    let prevented = 0
    const event = {
        button: 0,
        target: { closest: () => link },
        preventDefault: () => {
            prevented++
        },
    }
    router.onLinkClick(event)
    assert.deepEqual(destinations, [link.href])
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey', 'defaultPrevented']) {
        router.onLinkClick({ ...event, [modifier]: true })
    }
    router.onLinkClick({ ...event, button: 1 })
    link.target = '_blank'
    router.onLinkClick(event)
    link.target = ''
    link.hasAttribute = () => true
    router.onLinkClick(event)
    link.hasAttribute = () => false
    link.href = 'https://example.com/'
    router.onLinkClick(event)
    router.onLinkClick({ ...event, target: null })
    assert.equal(prevented, 1)
    assert.equal(destinations.length, 1)
})
