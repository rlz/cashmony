import { FastifyInstance, RawServerBase } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { AuthStorage } from 'rlz-engine/dist/back/auth/storage'
import { auth } from 'rlz-engine/dist/back/auth/utils'

import { MongoStorage } from './storage/mongo'

interface ManagementPluginOpts {
    appStorage: MongoStorage
    authStorage: AuthStorage
}

export const managementPlugin = fastifyPlugin(
    function managementPlugin<T extends RawServerBase>(app: FastifyInstance<T>, { appStorage, authStorage }: ManagementPluginOpts) {
        app.post(
            '/api/v0/clearAll',
            { },
            async (req, _resp) => {
                const userId = await auth(req.headers, authStorage)
                await appStorage.clearAll(userId)
            }
        )
    }
)
