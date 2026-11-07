'use strict'

import { defineConfig } from 'vite'
import { transformAsync } from '@babel/core'
import typescript from '@babel/preset-typescript'
import jsx from '@babel/plugin-transform-react-jsx'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    ssr: { external: ['@navse200/my-react'] },
    plugins: [
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.ts',
            injectRegister: false,
            manifest: false,
            injectManifest: { globPatterns: ['**/*.{html,js,css,png,jpg,jpeg,svg,webp,ico,woff,woff2}'] },
        }),
        {
            name: 'babel',
            enforce: 'pre',
            async transform(source, id) {
                const file = id.split('?')[0]
                if (!/\.[jt]sx?$/.test(file) || file.includes('/node_modules/')) return
                const result = await transformAsync(source, {
                    filename: file,
                    presets: [[typescript, { jsxPragma: 'createElement', onlyRemoveTypeImports: true }]],
                    plugins: /\.[jt]sx$/.test(file) ? [[jsx, { runtime: 'classic', pragma: 'createElement' }]] : [],
                    sourceMaps: true,
                    configFile: false,
                    babelrc: false,
                })
                if (result?.code == null) return null
                return { code: result.code, map: result.map ? JSON.stringify(result.map) : null }
            },
        },
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
            '/health': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
    optimizeDeps: {
        include: ['@navse200/my-react'],
        rolldownOptions: {
            transform: {
                jsx: {
                    runtime: 'classic',
                    pragma: 'createElement',
                },
            },
        },
    },
})
