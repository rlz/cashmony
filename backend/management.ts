import { FastifyInstance, RawServerBase } from 'fastify'

import { auth } from './auth'
import { MongoStorage } from './storage/mongo'

export function registerManagementEndpoints<T extends RawServerBase>(app: FastifyInstance<T>, mongo: MongoStorage) {
    app.post(
        '/api/v0/clearAll',
        { },
        async (req, _resp) => {
            const userId = await auth(req, mongo)
            await mongo.clearAll(userId)
        }
    )
}
