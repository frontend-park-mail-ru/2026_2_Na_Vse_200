import assert from 'node:assert/strict';
import { createServer, preview } from 'vite';

/**
 * Check that direct requests reach the app on dev and production preview servers.
 * Requires an existing dist/ produced by npm run build.
 * @param {string} label Server mode.
 * @param {import('node:http').Server} server Listening HTTP server.
 * @returns {Promise<void>}
 */
async function checkRoutes(label, server) {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const path of ['/', '/signup', '/login', '/login/', '/unknown/nested']) {
        const response = await fetch(`${base}${path}`, { headers: { Accept: 'text/html' } });
        assert.equal(response.status, 200, `${label}: ${path}`);
        const html = await response.text();
        assert.match(html, /id="root"/, `${label}: ${path} must return the app shell`);
        const modulePath = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
        assert.ok(modulePath?.startsWith('/'), 'Entry URL must be absolute');
        const moduleResponse = await fetch(`${base}${modulePath}`);
        assert.equal(moduleResponse.status, 200, `${label}: entry module loads`);
        assert.match(moduleResponse.headers.get('content-type'), /javascript/);
    }
    console.log(`${label}: direct routes, nested fallback and entry assets passed`);
}

const dev = await createServer({ server: { host: '127.0.0.1', port: 0 } });
try {
    await dev.listen();
    await checkRoutes('dev', dev.httpServer);
} finally {
    await dev.close();
}

const production = await preview({ preview: { host: '127.0.0.1', port: 0 } });
try {
    await checkRoutes('preview', production.httpServer);
} finally {
    await new Promise((resolve, reject) => production.httpServer.close(error => error ? reject(error) : resolve()));
}
