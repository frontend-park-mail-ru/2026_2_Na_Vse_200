declare const __ASSETS__: string[]
declare const __VERSION__: string

const sw = globalThis as unknown as ServiceWorkerGlobalScope
const scope = sw.registration.scope
const prefix = `2une-app-${scope}`
const appCache = prefix + __VERSION__
const imageCache = `2une-images-${scope}`
const assets = new Set(__ASSETS__.map(path => new URL(path, scope).href))
const index = new URL('index.html', scope).href

sw.addEventListener('install', event => {
    event.waitUntil(caches.open(appCache).then(cache => cache.addAll([...assets])))
})

sw.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(async keys => {
            await Promise.all(
                keys
                    .filter(
                        key =>
                            (key.startsWith(prefix) && key !== appCache) ||
                            (key.startsWith('workbox-precache-') && key.includes(scope)) ||
                            key === '2une-images-v1',
                    )
                    .map(key => caches.delete(key)),
            )
            await sw.clients.claim()
        }),
    )
})

const saveImage = async (cache: Cache, request: Request, response: Response) => {
    await cache.put(request, response)
    const keys = await cache.keys()
    await Promise.all(keys.slice(0, Math.max(0, keys.length - 100)).map(key => cache.delete(key)))
}

const loadImage = async (event: FetchEvent) => {
    const cache = await caches.open(imageCache)
    const saved = await cache.match(event.request)
    if (saved) return saved
    const response = await fetch(event.request)
    if (response.ok || response.type === 'opaque') {
        event.waitUntil(saveImage(cache, event.request, response.clone()).catch(() => undefined))
    }
    return response
}

sw.addEventListener('fetch', event => {
    const { request } = event
    const url = new URL(request.url)
    if (request.method !== 'GET' || !['http:', 'https:'].includes(url.protocol)) return
    if (/^\/api(?:\/|$)|^\/health(?:\/|$)/.test(url.pathname)) return

    const navigation =
        request.mode === 'navigate' && url.origin === sw.location.origin && !/\/[^/]+\.[^/]+$/.test(url.pathname)
    if (navigation || assets.has(url.href)) {
        event.respondWith(
            caches
                .open(appCache)
                .then(async cache => (await cache.match(navigation ? index : request)) ?? fetch(request)),
        )
    } else if (request.destination === 'image') {
        event.respondWith(loadImage(event))
    }
})
