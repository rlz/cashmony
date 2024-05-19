import { fastifyCompress } from '@fastify/compress'
import { fastifyCors } from '@fastify/cors'
import { fastifyResponseValidation } from '@fastify/response-validation'
import { fastifySensible } from '@fastify/sensible'
import formatsPlugin from 'ajv-formats'
import { fastify } from 'fastify'

import { registerAuthEndpoints } from './auth'
import { registerSyncEndpoints } from './sync'

async function main() {
    const app = fastify({ logger: true, ajv: { plugins: [formatsPlugin] } })

    await app.register(fastifyCors, {
        methods: ['get', 'post']
    })
    await app.register(fastifyCompress)
    await app.register(fastifySensible)
    await app.register(fastifyResponseValidation, { ajv: { plugins: [formatsPlugin] } })

    registerAuthEndpoints(app)
    registerSyncEndpoints(app)

    await app.listen({
        port: 3001
    })
}

main().catch((e) => {
    console.error('Main finished with error', e)
})
