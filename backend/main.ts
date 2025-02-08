import { registerAcmeAccount } from 'fastify-acme'
import { AUTH_API } from 'rlz-engine/dist/back/auth/controllers'
import { AuthStorage } from 'rlz-engine/dist/back/auth/storage'
import { PRODUCTION } from 'rlz-engine/dist/back/config'
import { runServer } from 'rlz-engine/dist/back/server'
import { MongoStorage } from 'rlz-engine/dist/back/storage/db'

import { managementPlugin } from './management'
import { CashmonyStorage } from './storage/mongo'
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
            const mongo = new MongoStorage('cashmony-app')

            const authStorage = await AuthStorage.create(mongo)
            const cashmonyStorage = await CashmonyStorage.create(server.log.child({ module: 'MONGO' }), mongo)

            server.register(AUTH_API, { storage: authStorage })
            server.register(syncPlugin, { authStorage, cashmonyStorage })
            server.register(managementPlugin, { authStorage, cashmonyStorage })
        }
    })
}

main().catch((e) => {
    console.error('Main finished with error', e)
})
