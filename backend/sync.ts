import { FastifyInstance, RawServerBase } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { DateTime } from 'luxon'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'

import { apiComparisonObjectSchemaV0, apiGetObjectsRequestSchemaV0, apiItemsRequestSchemaV0, apiItemsResponseSchemaV0, ApiItemsResponseV0 } from '../common/api_v0'
import { apiAccountSchemaV0, apiCategorySchemaV0, apiOperationSchemaV0, apiWatchSchemaV0 } from '../common/data_v0'
import { toValid } from '../common/dates'
import { auth } from './auth'
import { MongoStorage } from './storage/mongo'

const getObjectsQueryStringSchema = z.object({
    syncAfter: z.string().datetime().optional()
}).readonly()

interface SyncPluginOpts {
    mongo: MongoStorage
}

export const syncPlugin = fastifyPlugin(
    function syncPlugin<T extends RawServerBase>(app: FastifyInstance<T>, { mongo }: SyncPluginOpts) {
        app.get(
            '/api/v0/operations',
            {
                schema: {
                    querystring: zodToJsonSchema(getObjectsQueryStringSchema),
                    response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0)) }
                }
            },
            async (req, _resp) => {
                const userId = await auth(req, mongo)
                const query = getObjectsQueryStringSchema.parse(req.query)
                const syncAfter = query.syncAfter !== undefined ? toValid(DateTime.fromISO(query.syncAfter)) : undefined
                return { items: await mongo.allOps(userId, syncAfter) }
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
                const userId = await auth(req, mongo)
                const ids = apiGetObjectsRequestSchemaV0.parse(req.body).ids
                return { items: await mongo.getOps(userId, ids) }
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
                const userId = await auth(req, mongo)
                const ops = apiItemsRequestSchemaV0(apiOperationSchemaV0).parse(req.body).items
                await mongo.pushOps(userId, ops)
                resp.statusCode = 204
            }
        )

        app.get(
            '/api/v0/accounts',
            {
                schema: {
                    querystring: zodToJsonSchema(getObjectsQueryStringSchema),
                    response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0)) }
                }
            },
            async (req, _resp) => {
                const userId = await auth(req, mongo)
                const query = getObjectsQueryStringSchema.parse(req.query)
                const syncAfter = query.syncAfter !== undefined ? toValid(DateTime.fromISO(query.syncAfter)) : undefined
                return { items: await mongo.allAccounts(userId, syncAfter) }
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
                const userId = await auth(req, mongo)
                const ids = apiGetObjectsRequestSchemaV0.parse(req.body).ids
                return { items: await mongo.getAccounts(userId, ids) }
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
                const userId = await auth(req, mongo)
                const accounts = apiItemsRequestSchemaV0(apiAccountSchemaV0).parse(req.body).items
                await mongo.pushAccounts(userId, accounts)
                resp.statusCode = 204
            }
        )

        app.get(
            '/api/v0/categories',
            {
                schema: {
                    querystring: zodToJsonSchema(getObjectsQueryStringSchema),
                    response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0)) }
                }
            },
            async (req, _resp) => {
                const userId = await auth(req, mongo)
                const query = getObjectsQueryStringSchema.parse(req.query)
                const syncAfter = query.syncAfter !== undefined ? toValid(DateTime.fromISO(query.syncAfter)) : undefined
                return { items: await mongo.allCategories(userId, syncAfter) }
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
                const userId = await auth(req, mongo)
                const ids = apiGetObjectsRequestSchemaV0.parse(req.body).ids
                return { items: await mongo.getCategories(userId, ids) }
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
                const userId = await auth(req, mongo)
                const categories = apiItemsRequestSchemaV0(apiCategorySchemaV0).parse(req.body).items
                await mongo.pushCategories(userId, categories)
                resp.statusCode = 204
            }
        )

        app.get(
            '/api/v0/watches',
            {
                schema: {
                    querystring: zodToJsonSchema(getObjectsQueryStringSchema),
                    response: { 200: zodToJsonSchema(apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0)) }
                }
            },
            async (req, _resp) => {
                const userId = await auth(req, mongo)
                const query = getObjectsQueryStringSchema.parse(req.query)
                const syncAfter = query.syncAfter !== undefined ? toValid(DateTime.fromISO(query.syncAfter)) : undefined
                return { items: await mongo.allWatches(userId, syncAfter) }
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
                const userId = await auth(req, mongo)
                const ids = apiGetObjectsRequestSchemaV0.parse(req.body).ids
                return { items: await mongo.getWatches(userId, ids) }
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
                const userId = await auth(req, mongo)
                const watches = apiItemsRequestSchemaV0(apiWatchSchemaV0).parse(req.body).items
                await mongo.pushWatches(userId, watches)
                resp.statusCode = 204
            }
        )
    }
)
