import { fastifyCompress } from '@fastify/compress'
import { fastifyCors } from '@fastify/cors'
import { fastifyResponseValidation } from '@fastify/response-validation'
import { fastifySensible, httpErrors } from '@fastify/sensible'
import formatsPlugin from 'ajv-formats'
import { fastify, FastifyInstance, RawServerBase } from 'fastify'
import { createReadStream } from 'fs'
import { lstat } from 'fs/promises'
import mime from 'mime-types'
import path from 'path'

import { AcmeClient } from './acme'
import { registerAuthEndpoints } from './auth'
import { MongoStorage } from './storage/mongo'
import { registerSyncEndpoints } from './sync'

const settings = {
    domain: 'app2.cashmony.ru'
}

async function main() {
    if (process.argv[2] === 'acme-reg') {
        const acme = await AcmeClient.create(undefined)
        void acme.registerAccount('maslennikovdm@gmail.com')
    } else {
        await initServer()
    }
}

async function initServer() {
    const production = process.env.NODE_ENV === 'production'
    const acmeTokens: Record<string, string> = {}

    const unsecureServer = await initUnsecureServer(production, acmeTokens)

    if (!production) {
        return
    }

    const acme = await AcmeClient.create(unsecureServer.log.child({ module: 'Acme' }))

    const getCert = () => {
        return acme.cert(
            settings.domain,
            (token, content) => { acmeTokens[token] = content },
            (token) => { delete acmeTokens[token] }
        )
    }
    const cert = await getCert()

    const secureServer = fastify({
        http2: true,
        https: {
            allowHTTP1: true,
            cert: cert.cert,
            key: cert.key
        },
        logger: true,
        ajv: { plugins: [formatsPlugin] }
    })

    setInterval(
        () => {
            if (acme.shouldRenewCert()) {
                (async () => {
                    const cert = await getCert()
                    secureServer.server.setSecureContext({ cert: cert.cert, key: cert.key })
                })().catch((e): void => {
                    secureServer.log.error(e, 'Error while update certificate')
                })
            }
        },
        1000 * 60 * 60 // 1 hour
    )

    await secureServer.register(fastifyCors, {
        methods: ['get', 'post']
    })
    await secureServer.register(fastifyCompress)
    await secureServer.register(fastifySensible)
    await secureServer.register(fastifyResponseValidation, { ajv: { plugins: [formatsPlugin] } })

    const mongo = await MongoStorage.create(secureServer.log.child({ module: 'MONGO' }))

    registerStaticEndpoint(secureServer, 'web')
    registerAuthEndpoints(secureServer, mongo)
    registerSyncEndpoints(secureServer, mongo)

    await secureServer.listen({
        host: production ? '::' : '::1',
        port: 443
    })
}

async function initUnsecureServer(production: boolean, acmeTokens: Record<string, string>) {
    const s = fastify({
        logger: true,
        ajv: { plugins: [formatsPlugin] }
    })

    if (production) {
        s.get(
            '/.well-known/acme-challenge/:token',
            {},
            async (req, _resp) => {
                if (!(
                    req.params !== null
                    && typeof req.params === 'object'
                    && 'token' in req.params
                    && typeof req.params.token === 'string'
                )) {
                    return httpErrors.badRequest()
                }

                const token = req.params.token

                const body = acmeTokens[token]

                if (body === undefined) {
                    return httpErrors.notFound()
                }

                return body
            }
        )

        s.all(
            '*',
            {},
            async (req, resp) => {
                await resp.redirect(`https://${settings.domain}${req.url}`)
            }
        )
    } else {
        await s.register(fastifyCors, {
            methods: ['get', 'post']
        })
        await s.register(fastifyCompress)
        await s.register(fastifySensible)
        await s.register(fastifyResponseValidation, { ajv: { plugins: [formatsPlugin] } })

        const mongo = await MongoStorage.create(s.log.child({ module: 'MONGO' }))

        registerStaticEndpoint(s, 'dist')
        registerAuthEndpoints(s, mongo)
        registerSyncEndpoints(s, mongo)
    }

    await s.listen({
        host: production ? '::' : '::1',
        port: production ? 80 : 3001
    })

    return s
}

function registerStaticEndpoint<T extends RawServerBase>(server: FastifyInstance<T>, staticFilesPath: string) {
    server.get('*', async (req, resp) => {
        const p = req.url

        if (p.startsWith('/api/')) {
            throw httpErrors.notFound()
        }

        const np = path.normalize(path.join(staticFilesPath, p))
        if (!np.startsWith(`${staticFilesPath}/`)) {
            throw httpErrors.badRequest('Bad request: wrong path')
        }

        try {
            const stat = await lstat(np)
            if (!stat.isFile()) {
                throw 'Not found'
            }
            await resp.type(mime.lookup(np) || 'application/octet-stream')
                .send(createReadStream(`./${np}`))
        } catch {
            await resp.type('text/html')
                .send(createReadStream(`./${staticFilesPath}/index.html`))
        }
    })
}

main().catch((e) => {
    console.error('Main finished with error', e)
})
