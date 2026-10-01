import { cp, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendRoot = fileURLToPath(new URL('../', import.meta.url))
const source = resolve(frontendRoot, 'dist')
const destination = resolve(
    frontendRoot,
    '..',
    '..',
    'back',
    '2026_2_Na_Vse_200',
    'web',
    'dist',
)

await mkdir(dirname(destination), { recursive: true })
await cp(source, destination, { recursive: true, force: true })

console.log(`Frontend files copied to ${destination}`)
