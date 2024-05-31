import { DateTime } from 'luxon'
import { Binary, Collection, Db, MongoClient } from 'mongodb'

import { ApiComparisonObjectV0 } from '../../common/api_v0'
import { ApiAccountV0, ApiCategoryV0, ApiOperationV0, ApiWatchV0 } from '../../common/data_v0'
import { MongoObject, mongoObjectSchema, MongoTempPassword, MongoUser } from './model'

export class MongoStorage {
    client: MongoClient

    constructor() {
        this.client = new MongoClient('mongodb://localhost')
    }

    async createUser(id: string, name: string, email: string, passwordSalt: Binary, passwordHash: Binary) {
        await this.users.insertOne({
            _id: id,
            name,
            email,
            passwordSalt,
            passwordHash,
            lastActivityDate: DateTime.utc().toJSDate()
        })
    }

    async getUser(name: string): Promise<MongoUser | null> {
        return await this.users.findOne({ name })
    }

    async markUserActive(userId: string) {
        await this.users.updateOne({ _id: userId }, { $set: { lastActivityDate: DateTime.utc().toJSDate() } })
    }

    async pushTempPassword(userId: string, passwordHash: Binary, validUntil: Date) {
        await this.tempPasswords.insertOne({
            userId,
            passwordHash,
            validUntil
        })
    }

    async deleteTempPassword(userId: string, passwordHash: Binary) {
        await this.tempPasswords.deleteOne({ userId, passwordHash })
    }

    async getUserByTempPassword(userId: string, passwordHash: Binary): Promise<MongoUser | null> {
        const t = await this.tempPasswords.findOne({ userId, passwordHash })

        if (t === null) {
            return null
        }

        if (DateTime.utc() > DateTime.fromJSDate(t.validUntil)) {
            await this.tempPasswords.deleteOne({ _id: t._id })
            return null
        }

        return await this.users.findOne({ _id: t.userId })
    }

    async allOps(ownerId: string): Promise<ApiComparisonObjectV0[]> {
        return this.getAll(this.ops, ownerId)
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
                    filter: { _id: o.id },
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

    async allAccounts(ownerId: string): Promise<ApiComparisonObjectV0[]> {
        return this.getAll(this.accounts, ownerId)
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
                    filter: { _id: o.id },
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

    async allCategories(ownerId: string): Promise<ApiComparisonObjectV0[]> {
        return this.getAll(this.categories, ownerId)
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
                    filter: { _id: o.id },
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

    async allWatches(ownerId: string): Promise<ApiComparisonObjectV0[]> {
        return this.getAll(this.watches, ownerId)
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
                    filter: { _id: o.id },
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

    private async getAll<T>(c: Collection<MongoObject<T>>, ownerId: string): Promise<ApiComparisonObjectV0[]> {
        const items: ApiComparisonObjectV0[] = []
        const cursor = c.find({ ownerId }, {}).project({ 'data.lastModified': 1 })
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
        return this.client.db('cashmony-app')
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
