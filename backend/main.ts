import { registerAcmeAccount } from 'fastify-acme'
import { AUTH_API } from 'rlz-engine/dist/back/auth/controllers'
import { AuthStorage } from 'rlz-engine/dist/back/auth/storage'
import { PRODUCTION } from 'rlz-engine/dist/back/config'
import { runServer } from 'rlz-engine/dist/back/server'
import { MongoStorage as RlzEngineMongoStorage } from 'rlz-engine/dist/back/storage/db'

import { managementPlugin } from './management'
import { MongoStorage } from './storage/mongo'
import { syncPlugin } from './sync'

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
    await runServer({
        production: PRODUCTION,
        domain: settings.domain,
        certDir: settings.certDir,
        staticDir: PRODUCTION ? './web' : './front/dist',
        init: async (server) => {
            const mongo = await MongoStorage.create(server.log.child({ module: 'MONGO' }))

            const rlzEngineMongo = new RlzEngineMongoStorage('cashmony-app')
            const authStorage = new AuthStorage(rlzEngineMongo)

            server.register(AUTH_API, { storage: authStorage })
            server.register(syncPlugin, { authStorage, mongo })
            server.register(managementPlugin, { appStorage: mongo, authStorage })
        }
    })
}

main().catch((e) => {
    console.error('Main finished with error', e)
})
