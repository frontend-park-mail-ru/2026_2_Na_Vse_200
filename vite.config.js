'use strict'

import { defineConfig } from 'vite'

export default defineConfig({
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
    oxc: {
        jsx: {
            runtime: 'classic',
            pragma: 'createElement',
        },
    },
    optimizeDeps: {
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
