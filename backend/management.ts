import { FastifyInstance, RawServerBase } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { AuthStorage } from 'rlz-engine/dist/back/auth/storage'
import { auth } from 'rlz-engine/dist/back/auth/utils'

import { CashmonyStorage } from './storage/mongo'

interface ManagementPluginOpts {
    cashmonyStorage: CashmonyStorage
    authStorage: AuthStorage
}

export const managementPlugin = fastifyPlugin(
    function managementPlugin<T extends RawServerBase>(app: FastifyInstance<T>, { cashmonyStorage, authStorage }: ManagementPluginOpts) {
        app.post(
            '/api/v0/clearAll',
            { },
            async (req, _resp) => {
                const userId = await auth(req.headers, authStorage)
                await cashmonyStorage.clearAll(userId)
            }
        )
    }
)
