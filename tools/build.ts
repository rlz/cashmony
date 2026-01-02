import { build } from 'esbuild'
import { esbuildPluginPino } from 'esbuild-plugin-pino'
import { createRequire } from 'module'

global.require = createRequire(import.meta.url)

// esbuild backend/main.ts --bundle --keep-names --minify --define:process.env.NODE_ENV=\\\"production\\\" --platform=node --format=cjs --outfile=taskmony.cjs
await build({
    entryPoints: ['backend/main.ts'],
    bundle: true,
    keepNames: true,
    minify: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    platform: 'node',
    format: 'cjs',
    outdir: 'dist',
    plugins: [esbuildPluginPino({ transports: ['pino/file'] })]
})
