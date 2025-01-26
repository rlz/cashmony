import { FastifyInstance, RawServerBase } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import { auth } from './auth'
import { MongoStorage } from './storage/mongo'

interface ManagementPluginOpts {
    mongo: MongoStorage
}

export const managementPlugin = fastifyPlugin(
    function managementPlugin<T extends RawServerBase>(app: FastifyInstance<T>, { mongo }: ManagementPluginOpts) {
        app.post(
            '/api/v0/clearAll',
            { },
            async (req, _resp) => {
                const userId = await auth(req, mongo)
                await mongo.clearAll(userId)
            }
        )
    }
)
