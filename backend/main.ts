import { fastifyCompress } from '@fastify/compress'
import { fastifyCors } from '@fastify/cors'
import { fastifyResponseValidation } from '@fastify/response-validation'
import { fastifySensible, httpErrors } from '@fastify/sensible'
import staticPlugin from '@fastify/static'
import formatsPlugin from 'ajv-formats'
import { fastify, FastifyInstance, RawServerBase } from 'fastify'
import { fastifyAcmeSecurePlugin, fastifyAcmeUnsecurePlugin, getCertAndKey, registerAcmeAccount } from 'fastify-acme'
import { createReadStream } from 'fs'
import path from 'path'

import { registerAuthEndpoints } from './auth'
import { registerManagementEndpoints } from './management'
import { MongoStorage } from './storage/mongo'
import { registerSyncEndpoints } from './sync'

const settings = {
    certDir: './auth',
    domain: 'app.cashmony.ru'
}

async function main() {
    if (process.argv[2] === 'acme-reg') {
        await registerAcmeAccount(settings.certDir, 'maslennikovdm@gmail.com')
        process.stdout.write('Done\n')
    } else {
        await initServer()
    }
}

async function initServer() {
    const production = process.env.NODE_ENV === 'production'

    await initUnsecureServer(production)

    if (!production) {
        return
    }

    const certAndKey = await getCertAndKey(settings.certDir, settings.domain)

    const secureServer = fastify({
        http2: true,
        https: {
            allowHTTP1: true,
            cert: certAndKey.cert,
            key: certAndKey.pkey
        },
        logger: true,
        ajv: { plugins: [formatsPlugin] }
    })

    secureServer.register(fastifyAcmeSecurePlugin, { domain: settings.domain, certDir: settings.certDir })

    await secureServer.register(fastifyCors, {
        methods: ['get', 'post']
    })
    await secureServer.register(fastifyCompress)
    await secureServer.register(fastifySensible)
    await secureServer.register(fastifyResponseValidation, { ajv: { plugins: [formatsPlugin] } })

    const mongo = await MongoStorage.create(secureServer.log.child({ module: 'MONGO' }))

    registerAuthEndpoints(secureServer, mongo)
    registerSyncEndpoints(secureServer, mongo)
    registerManagementEndpoints(secureServer, mongo)
    registerStaticEndpoint(secureServer, 'web')

    await secureServer.listen({
        host: production ? '::' : '::1',
        port: 443
    })
}

async function initUnsecureServer(production: boolean) {
    const s = fastify({
        logger: true,
        ajv: { plugins: [formatsPlugin] }
    })

    if (production) {
        s.register(fastifyAcmeUnsecurePlugin, { redirectDomain: settings.domain })
    } else {
        await s.register(fastifyCors, {
            methods: ['get', 'post']
        })
        await s.register(fastifyCompress)
        await s.register(fastifySensible)
        await s.register(fastifyResponseValidation, { ajv: { plugins: [formatsPlugin] } })

        const mongo = await MongoStorage.create(s.log.child({ module: 'MONGO' }))

        registerAuthEndpoints(s, mongo)
        registerSyncEndpoints(s, mongo)
        registerManagementEndpoints(s, mongo)
        registerStaticEndpoint(s, 'dist')
    }

    await s.listen({
        host: production ? '::' : '::1',
        port: production ? 80 : 3001
    })

    return s
}

function registerStaticEndpoint<T extends RawServerBase>(server: FastifyInstance<T>, staticFilesPath: string) {
    server.all('/api/*', async () => {
        return httpErrors.notFound()
    })

    server.register((s) => {
        const staticFilesPathAbs = path.resolve(staticFilesPath)
        const indexFilePath = path.join(staticFilesPathAbs, 'index.html')

        s.register(staticPlugin, { root: staticFilesPathAbs })
        s.setNotFoundHandler(async (_req, resp) => {
            await resp.type('text/html')
                .send(createReadStream(indexFilePath))
        })
    })
}

main().catch((e) => {
    console.error('Main finished with error', e)
})
