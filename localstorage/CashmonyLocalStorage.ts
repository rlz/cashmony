import { type IDBPDatabase, openDB } from 'idb'
import { DateTime } from 'luxon'

import { Engine } from '../engine/engine'
import { Account, Category, Operation, Watch } from '../engine/model'
import { accFromIdb, accToIdb, catFromIdb, catToIdb, goalFromIdb, goalToIdb, opFromIdb, opToIdb } from './model'

const OPERATIONS_STORE_NAME = 'operations'
const OPERATIONS_DATE_INDEX_NAME = 'date'
const CATEGORIES_STORE_NAME = 'categories'
const CATEGORIES_STORE_NAME_V1 = 'categories_v1'
const ACCOUNTS_STORE_NAME = 'accounts'
const ACCOUNTS_STORE_NAME_V1 = 'accounts_v1'
const GOALS_STORE_NAME = 'goals'
const WATCHES_STORE_NAME = 'watches'

export class CashmonyLocalStorage {
    private engine: Engine

    constructor(engine: Engine) {
        engine.subscribe({
            onAccountChange: a => this.putAccount(a),
            onCategoryChange: c => this.putCategory(c),
            onWatchChange: w => this.putWatch(w),
            onOperationChange: o => this.putOperations([o]),
            onOperationsChange: ops => this.putOperations(ops),
            onClearData: () => this.clearData()
        })

        this.engine = engine
    }

    async loadData() {
        const accounts = await this.readAllAccounts()
        const categories = await this.readAllCategories()
        const watches = await this.readAllWatches()
        const operations = await this.readAllOperations()
        this.engine.init(accounts, categories, operations, watches)
    }

    private async openDb(): Promise<IDBPDatabase> {
        return await openDB('FinData', 5, {
            upgrade: (database, oldVersion, _newVersion, transaction) => {
                void (
                    async (): Promise<void> => {
                        if (oldVersion < 1) {
                            const opStore = database.createObjectStore(OPERATIONS_STORE_NAME, { keyPath: 'id' })
                            opStore.createIndex(OPERATIONS_DATE_INDEX_NAME, 'date', {})
                            database.createObjectStore(CATEGORIES_STORE_NAME, { keyPath: 'name' })
                            database.createObjectStore(ACCOUNTS_STORE_NAME, { keyPath: 'name' })
                        }
                        if (oldVersion < 3) {
                            const accs = (await transaction.objectStore(ACCOUNTS_STORE_NAME).getAll()).map(accFromIdb)
                            const cats = (await transaction.objectStore(CATEGORIES_STORE_NAME).getAll()).map(catFromIdb)
                            const accMap = Object.fromEntries(accs.map(a => [a.name, a.id]))
                            const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]))
                            const operations = (await transaction.objectStore(OPERATIONS_STORE_NAME).getAll())
                                .map(o => opFromIdb(o, accMap, catMap))

                            const opsStore = transaction.objectStore(OPERATIONS_STORE_NAME)
                            const promises: Promise<IDBValidKey>[] = []
                            for (const op of operations) {
                                if (op.type !== 'expense' && op.type !== 'income') {
                                    continue
                                }
                                if (op.categories.length === 1) {
                                    promises.push(
                                        opsStore.put(opToIdb({
                                            ...op,
                                            lastModified: DateTime.utc(),
                                            categories: [{
                                                ...op.categories[0],
                                                amount: op.amount
                                            }]
                                        }))
                                    )
                                }
                            }
                            await Promise.all(promises)
                        }

                        if (oldVersion < 4) {
                            database.createObjectStore(GOALS_STORE_NAME, { keyPath: 'name' })
                        }

                        if (oldVersion < 5) {
                            if (database.objectStoreNames.contains('rates')) {
                                database.deleteObjectStore('rates')
                            }

                            database.createObjectStore(CATEGORIES_STORE_NAME_V1, { keyPath: 'id' })
                            database.createObjectStore(WATCHES_STORE_NAME, { keyPath: 'id' })
                            database.createObjectStore(ACCOUNTS_STORE_NAME_V1, { keyPath: 'id' })

                            const accs = (await transaction.objectStore(ACCOUNTS_STORE_NAME).getAll()).map(accFromIdb)
                            await Promise.all(accs.map(async i => await transaction.objectStore(ACCOUNTS_STORE_NAME_V1).put(accToIdb(i))))

                            const cats = (await transaction.objectStore(CATEGORIES_STORE_NAME).getAll()).map(catFromIdb)
                            await Promise.all(cats.map(async i => await transaction.objectStore(CATEGORIES_STORE_NAME_V1).put(catToIdb(i))))

                            const watches = (await transaction.objectStore(GOALS_STORE_NAME).getAll()).map(goalFromIdb)
                            await Promise.all(watches.map(async i => await transaction.objectStore(WATCHES_STORE_NAME).put(goalToIdb(i))))

                            const accMap = Object.fromEntries(accs.map(a => [a.name, a.id]))
                            const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]))
                            const operations = (await transaction.objectStore(OPERATIONS_STORE_NAME).getAll())
                                .map(o => opFromIdb(o, accMap, catMap))
                            await Promise.all(operations.map(async i => await transaction.objectStore(OPERATIONS_STORE_NAME).put(opToIdb(i))))

                            database.deleteObjectStore(ACCOUNTS_STORE_NAME)
                            database.deleteObjectStore(CATEGORIES_STORE_NAME)
                            database.deleteObjectStore(GOALS_STORE_NAME)
                        }
                    }
                )()
            }
        })
    }

    async readAllOperations(): Promise<Operation[]> {
        const db = await this.openDb()

        const accountsMap = Object.fromEntries(
            (await this.readAllAccounts()).map(i => [i.name, i.id])
        )
        const categoriesMap = Object.fromEntries(
            (await this.readAllCategories()).map(i => [i.name, i.id])
        )

        return (await db.getAll(OPERATIONS_STORE_NAME)).map(i => opFromIdb(i, accountsMap, categoriesMap))
    }

    async readAllAccounts(): Promise<Account[]> {
        const db = await this.openDb()
        const accounts = await db.getAll(ACCOUNTS_STORE_NAME_V1)
        return (accounts).map(accFromIdb)
    }

    async putAccount(account: Account): Promise<void> {
        const db = await this.openDb()
        await db.put(
            ACCOUNTS_STORE_NAME_V1,
            accToIdb(account)
        )
    }

    async readAllCategories(): Promise<Category[]> {
        const db = await this.openDb()
        return (await db.getAll(CATEGORIES_STORE_NAME_V1)).map(c => catFromIdb(c))
    }

    async putCategory(category: Category): Promise<void> {
        const db = await this.openDb()
        await db.put(CATEGORIES_STORE_NAME_V1, catToIdb(category))
    }

    async putOperations(operations: readonly Operation[]): Promise<void> {
        const db = await this.openDb()

        const tx = db.transaction(OPERATIONS_STORE_NAME, 'readwrite')
        await Promise.all(operations.map(async o => await tx.store.put(opToIdb(o))))
        await tx.done
    }

    async clearData(): Promise<void> {
        const db = await this.openDb()

        await Promise.all([
            await db.clear(OPERATIONS_STORE_NAME),
            await db.clear(ACCOUNTS_STORE_NAME_V1),
            await db.clear(CATEGORIES_STORE_NAME_V1),
            await db.clear(WATCHES_STORE_NAME)
        ])
    }

    async readAllWatches(): Promise<Watch[]> {
        const db = await this.openDb()
        return (await db.getAll(WATCHES_STORE_NAME)).map(goalFromIdb)
    }

    async putWatch(goal: Watch): Promise<void> {
        const db = await this.openDb()
        await db.put(WATCHES_STORE_NAME, goalToIdb(goal)
        )
    }
}
