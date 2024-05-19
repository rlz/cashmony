import { FastifyInstance } from 'fastify'
import zodToJsonSchema from 'zod-to-json-schema'

import { apiComparisonObjectSchemaV0, apiGetObjectsRequestSchemaV0, apiItemsRequestSchemaV0, apiItemsResponseSchemaV0, ApiItemsResponseV0 } from '../common/api_v0'
import { apiAccountSchemaV0, apiCategorySchemaV0, apiOperationSchemaV0, apiWatchSchemaV0 } from '../common/data_v0'
import { auth } from './auth'
import { MongoStorage } from './storage/mongo'

export function registerSyncEndpoints(app: FastifyInstance) {
    app.get(
        '/api/v0/operations',
        {
            schema: {
                response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0)) }
            }
        },
        async (req, _resp) => {
            const userId = await auth(req)
            const s = MongoStorage.instance()
            return { items: await s.allOps(userId) }
        }
    )

    app.post(
        '/api/v0/operations/by-ids',
        {
            schema: {
                body: zodToJsonSchema(apiGetObjectsRequestSchemaV0),
                response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiOperationSchemaV0)) }
            }
        },
        async (req, _resp): Promise<ApiItemsResponseV0<typeof apiOperationSchemaV0>> => {
            const userId = await auth(req)
            const ids = apiGetObjectsRequestSchemaV0.parse(req.body).ids
            const s = MongoStorage.instance()
            return { items: await s.getOps(userId, ids) }
        }
    )

    app.post(
        '/api/v0/operations/push',
        {
            schema: {
                body: zodToJsonSchema(apiItemsRequestSchemaV0(apiOperationSchemaV0))
            },
            bodyLimit: 30 * 1024 * 1024
        },
        async (req, resp) => {
            const userId = await auth(req)
            const ops = apiItemsRequestSchemaV0(apiOperationSchemaV0).parse(req.body).items
            const s = MongoStorage.instance()
            await s.pushOps(userId, ops)
            resp.statusCode = 204
        }
    )

    app.get(
        '/api/v0/accounts',
        {
            schema: {
                response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0)) }
            }
        },
        async (req, _resp) => {
            const userId = await auth(req)
            const s = MongoStorage.instance()
            return { items: await s.allAccounts(userId) }
        }
    )

    app.post(
        '/api/v0/accounts/by-ids',
        {
            schema: {
                body: zodToJsonSchema(apiGetObjectsRequestSchemaV0),
                response: { 200: zodToJsonSchema(apiItemsRequestSchemaV0(apiAccountSchemaV0)) }
            }
        },
        async (req, _resp): Promise<ApiItemsResponseV0<typeof apiAccountSchemaV0>> => {
            const userId = await auth(req)
            const ids = apiGetObjectsRequestSchemaV0.parse(req.body).ids
            const s = MongoStorage.instance()
            return { items: await s.getAccounts(userId, ids) }
        }
    )

    app.post(
        '/api/v0/accounts/push',
        {
            schema: {
                body: zodToJsonSchema(apiItemsRequestSchemaV0(apiAccountSchemaV0))
            }
        },
        async (req, resp) => {
            const userId = await auth(req)
            const accounts = apiItemsRequestSchemaV0(apiAccountSchemaV0).parse(req.body).items
            const s = MongoStorage.instance()
            await s.pushAccounts(userId, accounts)
            resp.statusCode = 204
        }
    )

    app.get(
        '/api/v0/categories',
        {
            schema: {
                response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0)) }
            }
        },
        async (req, _resp) => {
            const userId = await auth(req)
            const s = MongoStorage.instance()
            return { items: await s.allCategories(userId) }
        }
    )

    app.post(
        '/api/v0/categories/by-ids',
        {
            schema: {
                body: zodToJsonSchema(apiGetObjectsRequestSchemaV0),
                response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiCategorySchemaV0)) }
            }
        },
        async (req, _resp): Promise<ApiItemsResponseV0<typeof apiCategorySchemaV0>> => {
            const userId = await auth(req)
            const ids = apiGetObjectsRequestSchemaV0.parse(req.body).ids
            const s = MongoStorage.instance()
            return { items: await s.getCategories(userId, ids) }
        }
    )

    app.post(
        '/api/v0/categories/push',
        {
            schema: {
                body: zodToJsonSchema(apiItemsRequestSchemaV0(apiCategorySchemaV0))
            }
        },
        async (req, resp) => {
            const userId = await auth(req)
            const categories = apiItemsRequestSchemaV0(apiCategorySchemaV0).parse(req.body).items
            const s = MongoStorage.instance()
            await s.pushCategories(userId, categories)
            resp.statusCode = 204
        }
    )

    app.get(
        '/api/v0/watches',
        {
            schema: {
                response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0)) }
            }
        },
        async (req, _resp) => {
            const userId = await auth(req)
            const s = MongoStorage.instance()
            return { items: await s.allWatches(userId) }
        }
    )

    app.post(
        '/api/v0/watches/by-ids',
        {
            schema: {
                body: zodToJsonSchema(apiGetObjectsRequestSchemaV0),
                response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiWatchSchemaV0)) }
            }
        },
        async (req, _resp): Promise<ApiItemsResponseV0<typeof apiWatchSchemaV0>> => {
            const userId = await auth(req)
            const ids = apiGetObjectsRequestSchemaV0.parse(req.body).ids
            const s = MongoStorage.instance()
            return { items: await s.getWatches(userId, ids) }
        }
    )

    app.post(
        '/api/v0/watches/push',
        {
            schema: {
                body: zodToJsonSchema(apiItemsRequestSchemaV0(apiWatchSchemaV0))
            }
        },
        async (req, resp) => {
            const userId = await auth(req)
            const watches = apiItemsRequestSchemaV0(apiWatchSchemaV0).parse(req.body).items
            const s = MongoStorage.instance()
            await s.pushWatches(userId, watches)
            resp.statusCode = 204
        }
    )
}
