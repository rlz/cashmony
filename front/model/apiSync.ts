import { DateTime } from 'luxon'
import { runInAction } from 'mobx'
import { AuthParam, Forbidden } from 'rlz-engine/dist/client/api/api'
import { AuthState } from 'rlz-engine/dist/client/state/auth'

import { apiAccounts, apiAccountsByIds, apiCategories, apiCategoriesByIds, apiOps, apiOpsByIds, apiPushAccounts, apiPushCategories, apiPushOps, apiPushWatches, apiWatches, apiWatchesByIds } from '../../api/api'
import { apiComparisonObjectSchemaV0, ApiItemsResponseV0 } from '../../common/api_v0'
import { ApiAccountV0, ApiCategoryV0, ApiOperationV0, ApiWatchV0 } from '../../common/data_v0'
import { Engine } from '../../engine/engine'
import { Account, Category, Operation, Watch } from '../../engine/model'
import { dFromIso, dtFromIso } from '../helpers/smallTools'
import { FrontState } from './FrontState'

let apiSyncInProgress = false

export async function apiSync(authState: AuthState, frontState: FrontState, engine: Engine, full?: boolean) {
    if (apiSyncInProgress) return
    apiSyncInProgress = true

    try {
        const auth = authState.authParam

        if (auth === null) {
            console.log('Skip sync: unauthenticated')
            return
        }

        if (frontState.dataUserId !== auth.userId) {
            await engine.clearData()
        }

        const startTime = DateTime.utc()

        try {
            const lastSyncDate = full === true ? null : frontState.lastSyncDate
            await syncAccounts(auth, engine, lastSyncDate)
            await syncCategories(auth, engine, lastSyncDate)
            await syncOps(auth, engine, lastSyncDate)
            await syncWatches(auth, engine, lastSyncDate)
            runInAction(() => {
                frontState.lastSyncDate = startTime
                frontState.dataUserId = auth.userId
            })
        } catch (e) {
            if (e instanceof Forbidden) {
                authState.logout()
            } else {
                throw e
            }
        }
    } finally {
        apiSyncInProgress = false
    }
}

async function syncItems<T extends { id: string, lastModified: DateTime<true> }>({
    getRemoteLastModified,
    localItems,
    pushRemote,
    getRemote,
    pushLocal,
    lastSyncDate
}: {
    getRemoteLastModified: () => Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>>
    localItems: readonly T[]
    pushRemote: (items: readonly T[]) => Promise<void>
    getRemote: (ids: readonly string[]) => Promise<T[]>
    pushLocal: (items: readonly T[]) => void
    lastSyncDate: DateTime<true> | null
}): Promise<void> {
    const remoteItems = (await getRemoteLastModified()).items
    const remoteItemsMap = Object.fromEntries(
        remoteItems.map(i => [i.id, dtFromIso(i.lastModified)])
    )

    const itemsToGet: string[] = []
    const itemsToPush: T[] = []

    for (const i of localItems) {
        const ri = remoteItemsMap[i.id]
        if (ri === undefined) {
            if (lastSyncDate === null || i.lastModified > lastSyncDate) {
                itemsToPush.push(i)
            }
            continue
        }

        if (ri.equals(i.lastModified)) {
            continue
        }

        if (ri < i.lastModified) {
            itemsToPush.push(i)
            continue
        }

        itemsToGet.push(i.id)
    }

    const knownItems = new Set(localItems.map(i => i.id))
    for (const { id } of remoteItems) {
        if (!knownItems.has(id)) {
            itemsToGet.push(id)
        }
    }

    if (itemsToPush.length > 0) {
        await pushRemote(itemsToPush)
    }

    if (itemsToGet.length > 0) {
        pushLocal((await getRemote(itemsToGet)))
    }
}

async function syncAccounts(auth: AuthParam, engine: Engine, lastSyncDate: DateTime<true> | null) {
    await syncItems({
        getRemoteLastModified: () => apiAccounts(auth, lastSyncDate),
        localItems: engine.accounts,
        pushRemote: (items: readonly Account[]) => apiPushAccounts(
            items.map((i): ApiAccountV0 => {
                return {
                    id: i.id,
                    name: i.name,
                    currency: i.currency,
                    hidden: i.hidden,
                    deleted: i.deleted === true,
                    lastModified: i.lastModified.toISO()
                }
            }),
            auth
        ),
        getRemote: async (ids: readonly string[]) => (await apiAccountsByIds(ids, auth))
            .items
            .map((a): Account => {
                return {
                    id: a.id,
                    name: a.name,
                    currency: a.currency,
                    hidden: a.hidden,
                    deleted: a.deleted,
                    lastModified: dtFromIso(a.lastModified)
                }
            }),
        pushLocal: (items: readonly Account[]) => items.forEach(i => engine.pushAccount(i)),
        lastSyncDate
    })
}

async function syncCategories(auth: AuthParam, engine: Engine, lastSyncDate: DateTime<true> | null) {
    await syncItems({
        getRemoteLastModified: () => apiCategories(auth, lastSyncDate),
        localItems: engine.categories,
        pushRemote: (items: readonly Category[]) => apiPushCategories(
            items.map((i): ApiCategoryV0 => {
                return {
                    id: i.id,
                    name: i.name,
                    perDayGoal: i.currency === undefined || i.perDayAmount === undefined
                        ? null
                        : {
                                currency: i.currency,
                                amount: i.perDayAmount
                            },
                    deleted: i.deleted === true,
                    lastModified: i.lastModified.toISO()
                }
            }),
            auth
        ),
        getRemote: async (ids: readonly string[]): Promise<Category[]> => (await apiCategoriesByIds(ids, auth))
            .items
            .map((a): Category => {
                return {
                    id: a.id,
                    name: a.name,
                    currency: a.perDayGoal?.currency,
                    perDayAmount: a.perDayGoal?.amount,
                    deleted: a.deleted,
                    lastModified: dtFromIso(a.lastModified)
                }
            }),
        pushLocal: (items: readonly Category[]) => items.forEach(i => engine.pushCategory(i)),
        lastSyncDate
    })
}

async function syncOps(auth: AuthParam, engine: Engine, lastSyncDate: DateTime<true> | null) {
    await syncItems({
        getRemoteLastModified: () => apiOps(auth, lastSyncDate),
        localItems: engine.operations,
        pushRemote: (items: readonly Operation[]): Promise<void> => {
            const ops = items.map((i): ApiOperationV0 => {
                if (i.type === 'deleted') {
                    return {
                        id: i.id,
                        type: i.type,
                        lastModified: i.lastModified.toISO()
                    }
                } else if (i.type === 'expense' || i.type === 'income') {
                    return {
                        id: i.id,
                        type: i.type,
                        value: {
                            currency: i.currency,
                            amount: i.amount
                        },
                        lastModified: i.lastModified.toISO(),
                        date: i.date.toISODate(),
                        account: i.account,
                        categories: i.categories,
                        tags: i.tags,
                        comment: i.comment
                    }
                } else if (i.type === 'transfer') {
                    return {
                        id: i.id,
                        type: i.type,
                        value: {
                            currency: i.currency,
                            amount: i.amount
                        },
                        lastModified: i.lastModified.toISO(),
                        date: i.date.toISODate(),
                        account: i.account,
                        toAccount: i.toAccount,
                        tags: i.tags,
                        comment: i.comment
                    }
                } else {
                    return {
                        id: i.id,
                        type: i.type,
                        value: {
                            currency: i.currency,
                            amount: i.amount
                        },
                        lastModified: i.lastModified.toISO(),
                        date: i.date.toISODate(),
                        account: i.account,
                        tags: i.tags,
                        comment: i.comment
                    }
                }
            })

            return apiPushOps(
                ops,
                auth
            )
        },
        getRemote: async (ids: readonly string[]): Promise<Operation[]> => (await apiOpsByIds(ids, auth))
            .items
            .map((i): Operation => {
                if (i.type === 'deleted') {
                    return {
                        id: i.id,
                        type: i.type,
                        lastModified: dtFromIso(i.lastModified)
                    }
                } else if (i.type === 'expense' || i.type === 'income') {
                    return {
                        id: i.id,
                        type: i.type,
                        currency: i.value.currency,
                        amount: i.value.amount,
                        lastModified: dtFromIso(i.lastModified),
                        date: dFromIso(i.date),
                        account: i.account,
                        categories: i.categories,
                        tags: i.tags,
                        comment: i.comment
                    }
                } else if (i.type === 'transfer') {
                    return {
                        id: i.id,
                        type: i.type,
                        currency: i.value.currency,
                        amount: i.value.amount,
                        lastModified: dtFromIso(i.lastModified),
                        date: dFromIso(i.date),
                        account: i.account,
                        toAccount: i.toAccount,
                        tags: i.tags,
                        comment: i.comment
                    }
                } else {
                    return {
                        id: i.id,
                        type: i.type,
                        currency: i.value.currency,
                        amount: i.value.amount,
                        lastModified: dtFromIso(i.lastModified),
                        date: dFromIso(i.date),
                        account: i.account,
                        tags: i.tags,
                        comment: i.comment
                    }
                }
            }),
        pushLocal: (items: readonly Operation[]) => engine.pushOperations(items),
        lastSyncDate
    })
}

async function syncWatches(auth: AuthParam, engine: Engine, lastSyncDate: DateTime<true> | null) {
    await syncItems({
        getRemoteLastModified: () => apiWatches(auth, lastSyncDate),
        localItems: engine.watches,
        pushRemote: (items: readonly Watch[]) => apiPushWatches(
            items.map((i): ApiWatchV0 => {
                return {
                    id: i.id,
                    name: i.name,
                    filter: i.filter,
                    perDayGoal: {
                        currency: i.currency,
                        amount: i.perDayAmount
                    },
                    deleted: i.deleted === true,
                    lastModified: i.lastModified.toISO()
                }
            }),
            auth
        ),
        getRemote: async (ids: readonly string[]) => (await apiWatchesByIds(ids, auth))
            .items
            .map((i): Watch => {
                return {
                    id: i.id,
                    name: i.name,
                    filter: i.filter,
                    currency: i.perDayGoal.currency,
                    perDayAmount: i.perDayGoal.amount,
                    deleted: i.deleted,
                    lastModified: dtFromIso(i.lastModified)
                }
            }),
        pushLocal: (items: readonly Watch[]) => items.forEach(i => engine.pushWatch(i)),
        lastSyncDate
    })
}
