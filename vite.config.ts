'use strict'

import { defineConfig } from 'vite'
import { transformAsync } from '@babel/core'
import typescript from '@babel/preset-typescript'
import jsx from '@babel/plugin-transform-react-jsx'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { transpileModule, ScriptTarget } from 'typescript'

export default defineConfig({
    ssr: { external: ['@navse200/my-react'] },
    plugins: [
        {
            name: 'offline',
            apply: 'build',
            generateBundle: {
                order: 'post',
                async handler(_, bundle) {
                    const source = await readFile(new URL('./src/sw.ts', import.meta.url), 'utf8')
                    const hash = createHash('sha256').update(source)
                    const assets = Object.keys(bundle).filter(path => !path.endsWith('.map'))
                    for (const path of assets) {
                        const file = bundle[path]
                        hash.update(file.type === 'chunk' ? file.code : file.source)
                    }
                    const worker = source
                        .replace('declare const __ASSETS__: string[]', '')
                        .replace('declare const __VERSION__: string', '')
                        .replace('__ASSETS__', JSON.stringify(assets))
                        .replace('__VERSION__', JSON.stringify(hash.digest('hex').slice(0, 12)))
                    this.emitFile({
                        type: 'asset',
                        fileName: 'sw.js',
                        source: transpileModule(worker, { compilerOptions: { target: ScriptTarget.ES2022 } })
                            .outputText,
                    })
                },
            },
        },
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
                target: 'http://127.0.0.1:8080',
                changeOrigin: true,
            },
            '/health': {
                target: 'http://127.0.0.1:8080',
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
