import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope & {
    __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
    new NavigationRoute(createHandlerBoundToURL('index.html'), {
        denylist: [/^\/api(?:\/|$)/, /^\/health(?:\/|$)/, /\/[^/?]+\.[^/]+$/],
    }),
)

// API/auth responses and audio never enter Cache Storage. User data lives in scoped IDB entries.
registerRoute(
    ({ request, url }) => request.destination === 'image' && !url.pathname.startsWith('/api/'),
    new CacheFirst({
        cacheName: '2une-images-v1',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60, purgeOnQuotaError: true }),
        ],
    }),
)

// Keep the existing worker until its tabs close, avoiding reloads that interrupt playback.
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
