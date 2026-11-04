'use strict'

import { defineConfig } from 'vite'
import { transformAsync } from '@babel/core'
import typescript from '@babel/preset-typescript'
import jsx from '@babel/plugin-transform-react-jsx'

export default defineConfig({
    plugins: [
        {
            name: 'babel',
            enforce: 'pre',
            async transform(source, id) {
                const file = id.split('?')[0]
                if (!/\.[jt]sx?$/.test(file) || file.includes('/node_modules/')) return
                const result = await transformAsync(source, {
                    filename: file,
                    presets: [[typescript, { jsxPragma: 'createElement', onlyRemoveTypeImports: true }]],
                    plugins: [[jsx, { runtime: 'classic', pragma: 'createElement' }]],
                    sourceMaps: true,
                    configFile: false,
                    babelrc: false,
                })
                return result && { code: result.code, map: result.map }
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
