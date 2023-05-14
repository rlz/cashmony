import { type IDBPDatabase, openDB } from 'idb'
import { type NotDeletedOperation, type Operation } from './model'
import { DateTime } from 'luxon'

const OPERATIONS_STORE_NAME = 'operations'
const OPERATIONS_DATE_INDEX_NAME = 'date'
const CATEGORIES_STORE_NAME = 'categories'
const ACCOUNTS_STORE_NAME = 'accounts'

async function openFinDataDb (): Promise<IDBPDatabase> {
    return await openDB('FinData', 1, {
        upgrade: (database) => {
            const opStore = database.createObjectStore(OPERATIONS_STORE_NAME, { keyPath: 'id' })
            opStore.createIndex(OPERATIONS_DATE_INDEX_NAME, 'date', {})
            database.createObjectStore(CATEGORIES_STORE_NAME, { keyPath: 'name' })
            database.createObjectStore(ACCOUNTS_STORE_NAME, { keyPath: 'name' })
        }
    })
}

export const FIN_DATA_DB = {
    async readAllOperations (): Promise<Operation[]> {
        const db = await openFinDataDb()
        return (await db.getAll(OPERATIONS_STORE_NAME)).map(storeToOp)
    },

    async getOperation (id: string): Promise<Operation> {
        const db = await openFinDataDb()
        return storeToOp(await db.get(OPERATIONS_STORE_NAME, id))
    },

    async getOperations (lower: DateTime, upper: DateTime): Promise<NotDeletedOperation[]> {
        const db = await openFinDataDb()
        return (await db.getAllFromIndex(
            OPERATIONS_STORE_NAME,
            OPERATIONS_DATE_INDEX_NAME,
            IDBKeyRange.bound(lower.toMillis(), upper.toMillis(), true, false)
        )).map(storeToOpNoDeleted)
    },

    async putOperations (operations: Operation[]): Promise<void> {
        const db = await openFinDataDb()

        const tx = db.transaction(OPERATIONS_STORE_NAME, 'readwrite')
        await Promise.all(operations.map(async o => await tx.store.put(opToStore(o))))
        await tx.done
    },

    async clearOperations (): Promise<void> {
        const db = await openFinDataDb()

        await db.clear(OPERATIONS_STORE_NAME)
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
