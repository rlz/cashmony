import { registerAcmeAccount } from 'fastify-acme'
import { PRODUCTION } from 'rlz-engine/dist/back/config'
import { runServer } from 'rlz-engine/dist/back/server'

import { authPlugin } from './auth'
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

            server.register(authPlugin, { mongo })
            server.register(syncPlugin, { mongo })
            server.register(managementPlugin, { mongo })
        }
    })
}

main().catch((e) => {
    console.error('Main finished with error', e)
})
