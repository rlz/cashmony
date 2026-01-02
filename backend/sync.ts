import { FastifyInstance, RawServerBase } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { DateTime } from 'luxon'
import { AuthStorage } from 'rlz-engine/back/auth/storage.js'
import { auth } from 'rlz-engine/back/auth/utils.js'
import { API_COMPARISON_OBJECT_SCHEMA_V0, API_GET_OBJECTS_REQUEST_SCHEMA_V0, API_ITEMS_REQUEST_SCHEMA_V0, API_ITEMS_RESPONSE_SCHEMA_V0, ApiItemsResponseV0 } from 'rlz-engine/shared/api/sync.js'
import { z } from 'zod'

import { apiAccountSchemaV0, apiCategorySchemaV0, apiOperationSchemaV0, apiWatchSchemaV0 } from '../common/data_v0.js'
import { toValid } from '../common/dates.js'
import { CashmonyStorage } from './storage/mongo.js'

const getObjectsQueryStringSchema = z.object({
    syncAfter: z.string().datetime().optional()
}).readonly()

interface SyncPluginOpts {
    authStorage: AuthStorage
    cashmonyStorage: CashmonyStorage
}

export const syncPlugin = fastifyPlugin(
    function syncPlugin<T extends RawServerBase>(app: FastifyInstance<T>, { authStorage, cashmonyStorage }: SyncPluginOpts) {
        app.get(
            '/api/v0/operations',
            {
                schema: {
                    querystring: getObjectsQueryStringSchema.toJSONSchema({ target: 'draft-07' })
                    // TODO: restore validation
                    // response: { 200: API_ITEMS_RESPONSE_SCHEMA_V0(API_COMPARISON_OBJECT_SCHEMA_V0).toJSONSchema({ target: 'draft-07' }) }
                }
            },
            async (req, _resp) => {
                const userId = await auth(req.headers, authStorage)
                const query = getObjectsQueryStringSchema.parse(req.query)
                const syncAfter = query.syncAfter !== undefined ? toValid(DateTime.fromISO(query.syncAfter)) : undefined
                return { items: await cashmonyStorage.allOps(userId, syncAfter) }
            }
        )

        app.post(
            '/api/v0/operations/by-ids',
            {
                schema: {
                    body: API_GET_OBJECTS_REQUEST_SCHEMA_V0.toJSONSchema({ target: 'draft-07' })
                    // TODO: restore validation
                    // response: { 200: API_ITEMS_RESPONSE_SCHEMA_V0(apiOperationSchemaV0).toJSONSchema({ target: 'draft-07' }) }
                }
            },
            async (req, _resp): Promise<ApiItemsResponseV0<typeof apiOperationSchemaV0>> => {
                const userId = await auth(req.headers, authStorage)
                const ids = API_GET_OBJECTS_REQUEST_SCHEMA_V0.parse(req.body).ids
                return { items: await cashmonyStorage.getOps(userId, ids) }
            }
        )

        app.post(
            '/api/v0/operations/push',
            {
                schema: {
                    // TODO: restore validation
                    // body: API_ITEMS_REQUEST_SCHEMA_V0(apiOperationSchemaV0).toJSONSchema({ target: 'draft-07' })
                },
                bodyLimit: 30 * 1024 * 1024
            },
            async (req, resp) => {
                const userId = await auth(req.headers, authStorage)
                const ops = API_ITEMS_REQUEST_SCHEMA_V0(apiOperationSchemaV0).parse(req.body).items
                await cashmonyStorage.pushOps(userId, ops)
                resp.statusCode = 204
            }
        )

        app.get(
            '/api/v0/accounts',
            {
                schema: {
                    querystring: getObjectsQueryStringSchema.toJSONSchema({ target: 'draft-07' }),
                    response: { 200: API_ITEMS_RESPONSE_SCHEMA_V0(API_COMPARISON_OBJECT_SCHEMA_V0).toJSONSchema({ target: 'draft-07' }) }
                }
            },
            async (req, _resp) => {
                const userId = await auth(req.headers, authStorage)
                const query = getObjectsQueryStringSchema.parse(req.query)
                const syncAfter = query.syncAfter !== undefined ? toValid(DateTime.fromISO(query.syncAfter)) : undefined
                return { items: await cashmonyStorage.allAccounts(userId, syncAfter) }
            }
        )

        app.post(
            '/api/v0/accounts/by-ids',
            {
                schema: {
                    body: API_GET_OBJECTS_REQUEST_SCHEMA_V0.toJSONSchema({ target: 'draft-07' }),
                    response: { 200: API_ITEMS_RESPONSE_SCHEMA_V0(apiAccountSchemaV0).toJSONSchema({ target: 'draft-07' }) }
                }
            },
            async (req, _resp): Promise<ApiItemsResponseV0<typeof apiAccountSchemaV0>> => {
                const userId = await auth(req.headers, authStorage)
                const ids = API_GET_OBJECTS_REQUEST_SCHEMA_V0.parse(req.body).ids
                return { items: await cashmonyStorage.getAccounts(userId, ids) }
            }
        )

        app.post(
            '/api/v0/accounts/push',
            {
                schema: {
                    body: API_ITEMS_REQUEST_SCHEMA_V0(apiAccountSchemaV0).toJSONSchema({ target: 'draft-07' })
                }
            },
            async (req, resp) => {
                const userId = await auth(req.headers, authStorage)
                const accounts = API_ITEMS_REQUEST_SCHEMA_V0(apiAccountSchemaV0).parse(req.body).items
                await cashmonyStorage.pushAccounts(userId, accounts)
                resp.statusCode = 204
            }
        )

        app.get(
            '/api/v0/categories',
            {
                schema: {
                    querystring: getObjectsQueryStringSchema.toJSONSchema({ target: 'draft-07' }),
                    response: { 200: API_ITEMS_RESPONSE_SCHEMA_V0(API_COMPARISON_OBJECT_SCHEMA_V0).toJSONSchema({ target: 'draft-07' }) }
                }
            },
            async (req, _resp) => {
                const userId = await auth(req.headers, authStorage)
                const query = getObjectsQueryStringSchema.parse(req.query)
                const syncAfter = query.syncAfter !== undefined ? toValid(DateTime.fromISO(query.syncAfter)) : undefined
                return { items: await cashmonyStorage.allCategories(userId, syncAfter) }
            }
        )

        app.post(
            '/api/v0/categories/by-ids',
            {
                schema: {
                    body: API_GET_OBJECTS_REQUEST_SCHEMA_V0.toJSONSchema({ target: 'draft-07' }),
                    response: { 200: API_ITEMS_RESPONSE_SCHEMA_V0(apiCategorySchemaV0).toJSONSchema({ target: 'draft-07' }) }
                }
            },
            async (req, _resp): Promise<ApiItemsResponseV0<typeof apiCategorySchemaV0>> => {
                const userId = await auth(req.headers, authStorage)
                const ids = API_GET_OBJECTS_REQUEST_SCHEMA_V0.parse(req.body).ids
                return { items: await cashmonyStorage.getCategories(userId, ids) }
            }
        )

        app.post(
            '/api/v0/categories/push',
            {
                schema: {
                    body: API_ITEMS_REQUEST_SCHEMA_V0(apiCategorySchemaV0).toJSONSchema({ target: 'draft-07' })
                }
            },
            async (req, resp) => {
                const userId = await auth(req.headers, authStorage)
                const categories = API_ITEMS_REQUEST_SCHEMA_V0(apiCategorySchemaV0).parse(req.body).items
                await cashmonyStorage.pushCategories(userId, categories)
                resp.statusCode = 204
            }
        )

        app.get(
            '/api/v0/watches',
            {
                schema: {
                    querystring: getObjectsQueryStringSchema.toJSONSchema({ target: 'draft-07' }),
                    response: { 200: API_ITEMS_RESPONSE_SCHEMA_V0(API_COMPARISON_OBJECT_SCHEMA_V0).toJSONSchema({ target: 'draft-07' }) }
                }
            },
            async (req, _resp) => {
                const userId = await auth(req.headers, authStorage)
                const query = getObjectsQueryStringSchema.parse(req.query)
                const syncAfter = query.syncAfter !== undefined ? toValid(DateTime.fromISO(query.syncAfter)) : undefined
                return { items: await cashmonyStorage.allWatches(userId, syncAfter) }
            }
        )

        app.post(
            '/api/v0/watches/by-ids',
            {
                schema: {
                    body: API_GET_OBJECTS_REQUEST_SCHEMA_V0.toJSONSchema({ target: 'draft-07' }),
                    response: { 200: API_ITEMS_RESPONSE_SCHEMA_V0(apiWatchSchemaV0).toJSONSchema({ target: 'draft-07' }) }
                }
            },
            async (req, _resp): Promise<ApiItemsResponseV0<typeof apiWatchSchemaV0>> => {
                const userId = await auth(req.headers, authStorage)
                const ids = API_GET_OBJECTS_REQUEST_SCHEMA_V0.parse(req.body).ids
                return { items: await cashmonyStorage.getWatches(userId, ids) }
            }
        )

        app.post(
            '/api/v0/watches/push',
            {
                schema: {
                    body: API_ITEMS_REQUEST_SCHEMA_V0(apiWatchSchemaV0).toJSONSchema({ target: 'draft-07' })
                }
            },
            async (req, resp) => {
                const userId = await auth(req.headers, authStorage)
                const watches = API_ITEMS_REQUEST_SCHEMA_V0(apiWatchSchemaV0).parse(req.body).items
                await cashmonyStorage.pushWatches(userId, watches)
                resp.statusCode = 204
            }
        )
    }
)
