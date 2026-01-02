import { FastifyBaseLogger } from 'fastify'
import { DateTime } from 'luxon'
import { Collection, Db } from 'mongodb'
import { MongoStorage } from 'rlz-engine/back/storage/db.js'
import { ApiComparisonObjectV0 } from 'rlz-engine/shared/api/sync.js'

import { ApiAccountV0, ApiCategoryV0, ApiOperationV0, ApiWatchV0 } from '../../common/data_v0.js'
import { MongoObject, mongoObjectSchema, MongoTempPassword, MongoUser } from './model.js'

export class CashmonyStorage {
    private readonly logger: FastifyBaseLogger
    private readonly storage: MongoStorage

    private constructor(logger: FastifyBaseLogger, storage: MongoStorage) {
        this.logger = logger

        this.storage = storage
    }

    static async create(logger: FastifyBaseLogger, storage: MongoStorage): Promise<CashmonyStorage> {
        const s = new CashmonyStorage(logger, storage)

        await s.createCollections()

        await Promise.all([
            s.storage.createIndexes(s.ops, [
                {
                    name: 'ownerId_v0',
                    key: {
                        ownerId: 1
                    }
                },
                {
                    name: 'ownerId_syncDate_v0',
                    key: {
                        ownerId: 1,
                        syncDate: 1
                    }
                }
            ]),
            s.storage.createIndexes(s.accounts, [
                {
                    name: 'ownerId_v0',
                    key: {
                        ownerId: 1
                    }
                },
                {
                    name: 'ownerId_syncDate_v0',
                    key: {
                        ownerId: 1,
                        syncDate: 1
                    }
                }
            ]),
            s.storage.createIndexes(s.categories, [
                {
                    name: 'ownerId_v0',
                    key: {
                        ownerId: 1
                    }
                },
                {
                    name: 'ownerId_syncDate_v0',
                    key: {
                        ownerId: 1,
                        syncDate: 1
                    }
                }
            ]),
            s.storage.createIndexes(s.watches, [
                {
                    name: 'ownerId_v0',
                    key: {
                        ownerId: 1
                    }
                },
                {
                    name: 'ownerId_syncDate_v0',
                    key: {
                        ownerId: 1,
                        syncDate: 1
                    }
                }
            ])
        ])

        return s
    }

    async allOps(ownerId: string, syncAfter?: DateTime<true>): Promise<ApiComparisonObjectV0[]> {
        return this.getAll(this.ops, ownerId, syncAfter)
    }

    async getOps(ownerId: string, ids: readonly string[]): Promise<ApiOperationV0[]> {
        const ops: ApiOperationV0[] = []
        for await (const op of this.ops.find({ _id: { $in: ids }, ownerId })) {
            ops.push(op.data)
        }
        return ops
    }

    async pushOps(ownerId: string, ops: readonly ApiOperationV0[]): Promise<void> {
        await this.ops.bulkWrite(ops.map((o) => {
            return {
                replaceOne: {
                    filter: { _id: o.id, ownerId },
                    replacement: {
                        _id: o.id,
                        ownerId,
                        syncDate: new Date(),
                        data: o
                    },
                    upsert: true
                }
            }
        }))
    }

    async allAccounts(ownerId: string, syncAfter?: DateTime<true>): Promise<ApiComparisonObjectV0[]> {
        return this.getAll(this.accounts, ownerId, syncAfter)
    }

    async getAccounts(ownerId: string, ids: readonly string[]): Promise<ApiAccountV0[]> {
        const vals: ApiAccountV0[] = []
        for await (const v of this.accounts.find({ _id: { $in: ids }, ownerId })) {
            vals.push(v.data)
        }
        return vals
    }

    async pushAccounts(ownerId: string, items: readonly ApiAccountV0[]) {
        await this.accounts.bulkWrite(items.map((o) => {
            return {
                replaceOne: {
                    filter: { _id: o.id, ownerId },
                    replacement: {
                        _id: o.id,
                        ownerId,
                        syncDate: new Date(),
                        data: o
                    },
                    upsert: true
                }
            }
        }))
    }

    async allCategories(ownerId: string, syncAfter?: DateTime<true>): Promise<ApiComparisonObjectV0[]> {
        return this.getAll(this.categories, ownerId, syncAfter)
    }

    async getCategories(ownerId: string, ids: readonly string[]): Promise<ApiCategoryV0[]> {
        const vals: ApiCategoryV0[] = []
        for await (const v of this.categories.find({ _id: { $in: ids }, ownerId })) {
            vals.push(v.data)
        }
        return vals
    }

    async pushCategories(ownerId: string, items: readonly ApiCategoryV0[]) {
        await this.categories.bulkWrite(items.map((o) => {
            return {
                replaceOne: {
                    filter: { _id: o.id, ownerId },
                    replacement: {
                        _id: o.id,
                        ownerId,
                        syncDate: new Date(),
                        data: o
                    },
                    upsert: true
                }
            }
        }))
    }

    async allWatches(ownerId: string, syncAfter?: DateTime<true>): Promise<ApiComparisonObjectV0[]> {
        return this.getAll(this.watches, ownerId, syncAfter)
    }

    async getWatches(ownerId: string, ids: readonly string[]): Promise<ApiWatchV0[]> {
        const vals: ApiWatchV0[] = []
        for await (const v of this.watches.find({ _id: { $in: ids }, ownerId })) {
            vals.push(v.data)
        }
        return vals
    }

    async pushWatches(ownerId: string, items: readonly ApiWatchV0[]) {
        await this.watches.bulkWrite(items.map((o) => {
            return {
                replaceOne: {
                    filter: { _id: o.id, ownerId },
                    replacement: {
                        _id: o.id,
                        ownerId,
                        syncDate: new Date(),
                        data: o
                    },
                    upsert: true
                }
            }
        }))
    }

    async clearAll(ownerId: string) {
        await this.ops.deleteMany({ ownerId })
        await this.watches.deleteMany({ ownerId })
        await this.categories.deleteMany({ ownerId })
        await this.accounts.deleteMany({ ownerId })
    }

    private async createCollections() {
        await Promise.all([
            'operations', 'accounts', 'categories', 'watches'
        ].map(i => this.storage.createCollection(i)))
    }

    private async getAll<T>(c: Collection<MongoObject<T>>, ownerId: string, syncAfter?: DateTime<true>): Promise<ApiComparisonObjectV0[]> {
        const items: ApiComparisonObjectV0[] = []
        const query = syncAfter === undefined
            ? { ownerId }
            : { ownerId, syncDate: { $gt: syncAfter.toJSDate() } }
        const cursor = c.find(query).project({ 'data.lastModified': 1 })
        for await (const op of cursor) {
            const parsed = mongoObjectSchema.parse(op)
            items.push({
                id: parsed._id,
                lastModified: parsed.data.lastModified
            })
        }
        return items
    }

    private get db(): Db {
        return this.storage.db
    }

    private get ops(): Collection<MongoObject<ApiOperationV0>> {
        return this.db.collection('operations')
    }

    private get accounts(): Collection<MongoObject<ApiAccountV0>> {
        return this.db.collection('accounts')
    }

    private get categories(): Collection<MongoObject<ApiCategoryV0>> {
        return this.db.collection('categories')
    }

    private get watches(): Collection<MongoObject<ApiWatchV0>> {
        return this.db.collection('watches')
    }

    private get users(): Collection<MongoUser> {
        return this.db.collection('users')
    }

    private get tempPasswords(): Collection<MongoTempPassword> {
        return this.db.collection('temp-passwords')
    }
}
