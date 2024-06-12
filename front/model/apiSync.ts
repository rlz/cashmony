import { DateTime } from 'luxon'
import { runInAction } from 'mobx'

import { apiAccounts, apiAccountsByIds, apiCategories, apiCategoriesByIds, apiOps, apiOpsByIds, apiPushAccounts, apiPushCategories, apiPushOps, apiPushWatches, apiWatches, apiWatchesByIds, Forbidden } from '../../api/api'
import { ApiAuthResponseV0, apiComparisonObjectSchemaV0, ApiItemsResponseV0 } from '../../common/api_v0'
import { ApiOperationV0 } from '../../common/data_v0'
import { Engine } from '../../engine/engine'
import { Account, Category, Operation, Watch } from '../../engine/model'
import { dFromIso, dtFromIso } from '../helpers/smallTools'
import { FrontState } from './FrontState'

export async function apiSync(frontState: FrontState, engine: Engine) {
    if (frontState.auth === null) {
        console.log('Skip sync: unauthenticated')
        return
    }

    try {
        await syncAccounts(frontState.auth, engine)
        await syncCategories(frontState.auth, engine)
        await syncOps(frontState.auth, engine)
        await syncWatches(frontState.auth, engine)
        runInAction(() => {
            frontState.lastSyncDate = DateTime.utc()
        })
    } catch (e) {
        if (e instanceof Forbidden) {
            runInAction(() => {
                frontState.auth = null
            })
        } else {
            throw e
        }
    }
}

async function syncItems<T extends { id: string, lastModified: DateTime<true> }>(
    getRemoteLastModified: () => Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>>,
    localItems: readonly T[],
    pushRemote: (items: readonly T[]) => Promise<void>,
    getRemote: (ids: readonly string[]) => Promise<T[]>,
    pushLocal: (items: readonly T[]) => void
): Promise<void> {
    const remoteAccounts = (await getRemoteLastModified()).items
    const remoteAccountsMap = Object.fromEntries(
        remoteAccounts.map(i => [i.id, dtFromIso(i.lastModified)])
    )

    const getAccounts: string[] = []
    const pushAccounts: T[] = []

    for (const a of localItems) {
        const ra = remoteAccountsMap[a.id]
        if (ra === undefined) {
            pushAccounts.push(a)
            continue
        }

        if (ra.equals(a.lastModified)) {
            continue
        }

        if (ra < a.lastModified) {
            pushAccounts.push(a)
            continue
        }

        getAccounts.push(a.id)
    }

    const knownAccounts = new Set(localItems.map(i => i.id))
    for (const { id } of remoteAccounts) {
        if (!knownAccounts.has(id)) {
            getAccounts.push(id)
        }
    }

    if (pushAccounts.length > 0) {
        await pushRemote(pushAccounts)
    }

    if (getAccounts.length > 0) {
        pushLocal((await getRemote(getAccounts)))
    }
}

async function syncAccounts(auth: ApiAuthResponseV0, engine: Engine) {
    await syncItems(
        () => apiAccounts(auth),
        engine.accounts,
        (items: readonly Account[]) => apiPushAccounts(
            items.map((i) => {
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
        async (ids: readonly string[]) => (await apiAccountsByIds(ids, auth))
            .items
            .map((a) => {
                return {
                    id: a.id,
                    name: a.name,
                    currency: a.currency,
                    hidden: a.hidden,
                    deleted: a.deleted,
                    lastModified: dtFromIso(a.lastModified)
                }
            }),
        (items: readonly Account[]) => items.forEach(i => engine.pushAccount(i))
    )
}

async function syncCategories(auth: ApiAuthResponseV0, engine: Engine) {
    await syncItems(
        () => apiCategories(auth),
        engine.categories,
        (items: readonly Category[]) => apiPushCategories(
            items.map((i) => {
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
        async (ids: readonly string[]) => (await apiCategoriesByIds(ids, auth))
            .items
            .map((a) => {
                return {
                    id: a.id,
                    name: a.name,
                    currency: a.perDayGoal?.currency,
                    amount: a.perDayGoal?.amount,
                    deleted: a.deleted,
                    lastModified: dtFromIso(a.lastModified)
                }
            }),
        (items: readonly Category[]) => items.forEach(i => engine.pushCategory(i))
    )
}

async function syncOps(auth: ApiAuthResponseV0, engine: Engine) {
    await syncItems(
        () => apiOps(auth),
        engine.operations,
        (items: readonly Operation[]) => {
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
        async (ids: readonly string[]) => (await apiOpsByIds(ids, auth))
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
        (items: readonly Operation[]) => engine.pushOperations(items)
    )
}

async function syncWatches(auth: ApiAuthResponseV0, engine: Engine) {
    await syncItems(
        () => apiWatches(auth),
        engine.watches,
        (items: readonly Watch[]) => apiPushWatches(
            items.map((i) => {
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
        async (ids: readonly string[]) => (await apiWatchesByIds(ids, auth))
            .items
            .map((i) => {
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
        (items: readonly Watch[]) => items.forEach(i => engine.pushWatch(i))
    )
}
