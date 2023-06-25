import { type IDBPDatabase, openDB } from 'idb'
import { type Category, type Account, type NotDeletedOperation, type Operation, type CurrencyRatesCache, ratesMonth, type ExpensesGoal } from './model'
import { DateTime } from 'luxon'
import { runAsync } from '../helpers/smallTools'

const OPERATIONS_STORE_NAME = 'operations'
const OPERATIONS_DATE_INDEX_NAME = 'date'
const CATEGORIES_STORE_NAME = 'categories'
const ACCOUNTS_STORE_NAME = 'accounts'
const RATES_STORE_NAME = 'rates'
const GOALS_STORE_NAME = 'goals'

let FIN_DATA_DB: FinDataDb | null = null

export class FinDataDb {
    static instance (): FinDataDb {
        if (FIN_DATA_DB === null) {
            FIN_DATA_DB = new FinDataDb()
        }

        return FIN_DATA_DB
    }

    private async openDb (): Promise<IDBPDatabase> {
        return await openDB('FinData', 4, {
            upgrade: (database, oldVersion, newVersion) => {
                if (oldVersion < 1) {
                    const opStore = database.createObjectStore(OPERATIONS_STORE_NAME, { keyPath: 'id' })
                    opStore.createIndex(OPERATIONS_DATE_INDEX_NAME, 'date', {})
                    database.createObjectStore(CATEGORIES_STORE_NAME, { keyPath: 'name' })
                    database.createObjectStore(ACCOUNTS_STORE_NAME, { keyPath: 'name' })
                }
                if (oldVersion < 2) {
                    database.createObjectStore(RATES_STORE_NAME, { keyPath: 'key' })
                }
                if (oldVersion < 3) {
                    runAsync(async () => {
                        const db = FinDataDb.instance()
                        const toUpdate: Operation[] = []
                        for (const op of await db.readAllOperations()) {
                            if (op.type !== 'expense' && op.type !== 'income') {
                                continue
                            }
                            if (op.categories.length === 1) {
                                toUpdate.push({
                                    ...op,
                                    lastModified: DateTime.utc(),
                                    categories: [{
                                        ...op.categories[0],
                                        amount: op.amount
                                    }]
                                })
                            }
                        }
                        await db.putOperations(toUpdate)
                        location.reload()
                    })
                }
                if (oldVersion < 4) {
                    database.createObjectStore(GOALS_STORE_NAME, { keyPath: 'name' })
                }
            }
        })
    }

    async getRates (month: DateTime, currency: string): Promise<CurrencyRatesCache | null> {
        const db = await this.openDb()

        const cache = await db.get(RATES_STORE_NAME, ratesKey(month, currency))

        if (cache === undefined) return null

        return {
            ...cache,
            loadDate: DateTime.fromISO(cache.loadDate)
        }
    }

    async putRates (rates: CurrencyRatesCache): Promise<void> {
        const month = ratesMonth(rates)

        const db = await this.openDb()
        await db.put(RATES_STORE_NAME, {
            ...rates,
            key: ratesKey(month, rates.currency),
            loadDate: rates.loadDate.toISO()
        })
    }

    async readAllOperations (): Promise<Operation[]> {
        const db = await this.openDb()
        return (await db.getAll(OPERATIONS_STORE_NAME)).map(storeToOp)
    }

    async readAllAccounts (): Promise<Account[]> {
        const db = await this.openDb()
        return (
            (await db.getAll(ACCOUNTS_STORE_NAME))
                .map(a => {
                    return {
                        ...a,
                        lastModified: DateTime.fromMillis(a.lastModified ?? 0, { zone: 'utc' })
                    }
                })
        ) as Account[]
    }

    async putAccount (account: Account): Promise<void> {
        const db = await this.openDb()
        await db.put(
            ACCOUNTS_STORE_NAME,
            { ...account, lastModified: account.lastModified.toMillis() }
        )
    }

    async readAllCategories (): Promise<Category[]> {
        const db = await this.openDb()
        return (
            (await db.getAll(CATEGORIES_STORE_NAME))
                .map(c => {
                    delete c.currency
                    delete c.yearGoal
                    return {
                        ...c,
                        lastModified: DateTime.fromMillis(c.lastModified ?? 0, { zone: 'utc' })
                    }
                })
        ) as Category[]
    }

    async putCategory (category: Category): Promise<void> {
        const db = await this.openDb()
        await db.put(
            CATEGORIES_STORE_NAME,
            { ...category, lastModified: category.lastModified.toMillis() }
        )
    }

    async getOperation (id: string): Promise<Operation> {
        const db = await this.openDb()
        return storeToOp(await db.get(OPERATIONS_STORE_NAME, id))
    }

    async getOperations (lower: DateTime, upper: DateTime): Promise<NotDeletedOperation[]> {
        const db = await this.openDb()
        return (await db.getAllFromIndex(
            OPERATIONS_STORE_NAME,
            OPERATIONS_DATE_INDEX_NAME,
            IDBKeyRange.bound(lower.toMillis(), upper.toMillis(), true, false)
        )).map(storeToOpNoDeleted)
    }

    async putOperations (operations: Operation[]): Promise<void> {
        const db = await this.openDb()

        const tx = db.transaction(OPERATIONS_STORE_NAME, 'readwrite')
        await Promise.all(operations.map(async o => await tx.store.put(opToStore(o))))
        await tx.done
    }

    async clearOperations (): Promise<void> {
        const db = await this.openDb()

        await db.clear(OPERATIONS_STORE_NAME)
    }

    async readAllExpensesGoals (): Promise<ExpensesGoal[]> {
        const db = await this.openDb()
        return (
            (await db.getAll(GOALS_STORE_NAME))
                .map(i => {
                    return {
                        ...i,
                        lastModified: DateTime.fromMillis(i.lastModified ?? 0, { zone: 'utc' })
                    }
                })
        ) as ExpensesGoal[]
    }

    async putExpensesGoal (goal: ExpensesGoal): Promise<void> {
        const db = await this.openDb()
        await db.put(
            GOALS_STORE_NAME,
            { ...goal, lastModified: goal.lastModified.toMillis() }
        )
    }
}

function opToStore (o: Operation): any {
    if (o.type === 'deleted') {
        return o
    }

    return {
        ...o,
        lastModified: o.lastModified.toMillis(),
        date: o.date.toMillis()
    }
}

function storeToOpNoDeleted (o: any): NotDeletedOperation {
    return {
        ...o,
        lastModified: DateTime.fromMillis(o.lastModified, { zone: 'utc' }),
        date: DateTime.fromMillis(o.date, { zone: 'utc' })
    }
}

function storeToOp (o: any): Operation {
    if (o.type === 'deleted') {
        return o
    }

    return storeToOpNoDeleted(o)
}

function ratesKey (month: DateTime, currency: string): string {
    return `${month.toFormat('yyyy-MM')}-${currency}`
}
