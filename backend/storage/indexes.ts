import { FastifyBaseLogger } from 'fastify'
import { Collection, Document, IndexDescription } from 'mongodb'

type CashmonyIndexDescription = IndexDescription & {
    name: string
}

const allIndexes: { [colName: string]: readonly CashmonyIndexDescription[] } = {
    'operations': [
        {
            name: 'owner_v0',
            key: {
                owner: 1
            }
        }
    ],
    'accounts': [
        {
            name: 'owner_v0',
            key: {
                owner: 1
            }
        }
    ],
    'categories': [
        {
            name: 'owner_v0',
            key: {
                owner: 1
            }
        }
    ],
    'watches': [
        {
            name: 'owner_v0',
            key: {
                owner: 1
            }
        }
    ],
    'users': [
        {
            name: 'name_v0',
            key: {
                name: 1
            },
            unique: true
        }
    ],
    'temp-passwords': [
        {
            name: 'userId_v0',
            key: {
                userId: 1
            }
        },
        {
            name: 'ttl_v0',
            key: {
                passwordHash: 1
            },
            // Temp passwords also have expirity dates, make sure they are syncronized with this expirity index
            expireAfterSeconds: 60 * 60 * 24 * 7 // 7 days
        }
    ]
}

export async function listIndexes<T extends Document>(collection: Collection<T>): Promise<Set<string>> {
    const indexes: IndexDescription[] = await collection.listIndexes().toArray()
    return new Set(indexes.map((i) => {
        if (i.name === undefined) {
            throw Error('Index with undefined name detected!')
        }
        return i.name
    }))
}

export async function createIndexes<T extends Document>(logger: FastifyBaseLogger, collection: Collection<T>) {
    const indexes = allIndexes[collection.collectionName]

    logger.info({ indexes: indexes?.map(i => i.name) ?? null, collection: collection.collectionName }, 'Configured indexes')

    if (indexes === undefined) {
        return
    }

    const knownIndexes = await listIndexes(collection)

    logger.info({ indexes: Array.from(knownIndexes), collection: collection.collectionName }, 'Known indexes')

    knownIndexes.delete('_id_')

    for (const index of indexes) {
        if (knownIndexes.has(index.name)) {
            knownIndexes.delete(index.name)
            continue
        }

        logger.info({ index, collection: collection.collectionName }, 'Create index')

        await collection.createIndexes([index])
    }

    for (const name of knownIndexes) {
        logger.info({ index: name, collection: collection.collectionName }, 'Drop index')

        await collection.dropIndex(name)
    }
}
