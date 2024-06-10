import { Engine } from '../engine/engine'
import { type Account, type Category, type Operation, type Watch } from '../engine/model'
import { deepEqual } from '../front/helpers/deepEqual'
import { Google } from './google'

const google = Google.instance()

export async function initGoogleSync(): Promise<void> {
    await google.authenticate()
}

export interface SyncStats {
    matched: number
    latestInGoogle: number
    latestInLocal: number
    missedInGoogle: number
    missedInLocal: number
}

export interface SyncStatsEx extends SyncStats {
    deletedInGoogle: number
    deletedInLocal: number
}

export async function syncAccounts(engine: Engine): Promise<SyncStats> {
    const googleAccounts = await google.loadAccounts(engine)
    const localAccounts = new Map(engine.accounts.map(i => [i.id, i]))

    const googleAccsMap = new Map<string, Account>()
    googleAccounts.forEach(i => googleAccsMap.set(i.name, i))

    const localAccsMap = new Map<string, Account>()
    localAccounts.forEach(i => localAccsMap.set(i.name, i))

    let matched = 0
    const latestInGoogle: Account[] = []
    let latestInLocal = 0
    const missedInLocal: Account[] = []

    for (const googleAcc of googleAccounts) {
        const localAcc = localAccsMap.get(googleAcc.name)

        if (localAcc === undefined) {
            missedInLocal.push(googleAcc)
            continue
        }

        localAccsMap.delete(googleAcc.name)

        if (deepEqual(googleAcc, localAcc) || (localAcc.deleted === true && googleAcc.deleted === true)) {
            matched += 1
        } else if (localAcc.lastModified.toMillis() >= googleAcc.lastModified.toMillis()) {
            latestInLocal += 1
            console.debug('Latest in local', { localAcc, googleAcc })
        } else {
            latestInGoogle.push(googleAcc)
        }
    }

    const syncStats = {
        matched,
        latestInGoogle: latestInGoogle.length,
        latestInLocal,
        missedInGoogle: localAccsMap.size,
        missedInLocal: missedInLocal.length
    }

    console.log('Accounts Sync Result', syncStats);

    [...missedInLocal, ...latestInGoogle].forEach(i => engine.pushAccount(i))

    // if (latestInLocal > 0 || localAccsMap.size > 0) {
    //     await google.storeAccounts(engine.accounts)
    // }

    return syncStats
}

export async function syncCategories(engine: Engine): Promise<SyncStats> {
    const googleCategories = await google.loadCategories(engine)
    const localCategories = new Map(engine.categories.map(i => [i.id, i]))
    const googleCatsMap = new Map<string, Category>()
    googleCategories.forEach(i => googleCatsMap.set(i.name, i))

    const localCatsMap = new Map<string, Category>()
    localCategories.forEach(i => localCatsMap.set(i.name, i))

    let matched = 0
    const latestInGoogle: Category[] = []
    let latestInLocal = 0
    const missedInLocal: Category[] = []

    for (const googleCat of googleCategories) {
        const localCat = localCatsMap.get(googleCat.name)

        if (localCat === undefined) {
            missedInLocal.push(googleCat)
            continue
        }

        localCatsMap.delete(googleCat.name)

        if (deepEqual(googleCat, localCat) || (localCat.deleted === true && googleCat.deleted === true)) {
            matched += 1
        } else if (localCat.lastModified.toMillis() >= googleCat.lastModified.toMillis()) {
            latestInLocal += 1
            console.debug('Latest in local', { localCat, googleCat })
        } else {
            latestInGoogle.push(googleCat)
        }
    }

    const syncStats = {
        matched,
        latestInGoogle: latestInGoogle.length,
        latestInLocal,
        missedInGoogle: localCatsMap.size,
        missedInLocal: missedInLocal.length
    }

    console.log('Categories Sync Result', syncStats);

    [...missedInLocal, ...latestInGoogle].forEach(i => engine.pushCategory(i))

    // if (latestInLocal > 0 || localCatsMap.size > 0) {
    //     await google.storeCategories(engine.categories)
    // }

    return syncStats
}

export async function syncGoals(engine: Engine): Promise<SyncStats> {
    const googleGoals = await google.loadGoals(engine)
    const localGoals = new Map(engine.watches.map(i => [i.id, i]))

    const googleGoalsMap = new Map<string, Watch>()
    googleGoals.forEach(i => googleGoalsMap.set(i.name, i))

    const localGoalsMap = new Map<string, Watch>()
    localGoals.forEach(i => localGoalsMap.set(i.name, i))

    let matched = 0
    const latestInGoogle: Watch[] = []
    let latestInLocal = 0
    const missedInLocal: Watch[] = []

    for (const googleGoal of googleGoals) {
        const localGoal = localGoalsMap.get(googleGoal.name)

        if (localGoal === undefined) {
            missedInLocal.push(googleGoal)
            continue
        }

        localGoalsMap.delete(googleGoal.name)

        if (deepEqual(googleGoal, localGoal) || (localGoal.deleted === true && googleGoal.deleted === true)) {
            matched += 1
        } else if (localGoal.lastModified.toMillis() >= googleGoal.lastModified.toMillis()) {
            latestInLocal += 1
            console.debug('Latest in local', { localGoal, googleGoal })
        } else {
            latestInGoogle.push(googleGoal)
        }
    }

    const syncStats = {
        matched,
        latestInGoogle: latestInGoogle.length,
        latestInLocal,
        missedInGoogle: localGoalsMap.size,
        missedInLocal: missedInLocal.length
    }

    console.log('Goals Sync Result', syncStats);

    [...missedInLocal, ...latestInGoogle].forEach(i => engine.pushWatch(i))

    // if (latestInLocal > 0 || localGoalsMap.size > 0) {
    //     await google.storeGoals(engine.watches, engine)
    // }

    return syncStats
}

export async function syncOperations(engine: Engine): Promise<SyncStatsEx> {
    const googleOps = await google.loadOperations(engine)
    const localOps = new Map(engine.operations.map(i => [i.id, i]))

    const googleOpsMap = new Map<string, Operation>()
    googleOps.forEach(o => googleOpsMap.set(o.id, o))

    const localOpsMap = new Map<string, Operation>()
    localOps.forEach(o => localOpsMap.set(o.id, o))

    let matched = 0
    const latestInGoogle: Operation[] = []
    let latestInLocal = 0
    const missedInLocal: Operation[] = []
    const deletedInGoogle: Operation[] = []
    let deletedInLocal = 0

    for (const googleOp of googleOps) {
        const localOp = localOpsMap.get(googleOp.id)

        if (localOp === undefined) {
            missedInLocal.push(googleOp)
            continue
        }

        localOpsMap.delete(googleOp.id)

        if (deepEqual(googleOp, localOp)) {
            matched += 1
        } else if (googleOp.type === 'deleted') {
            deletedInGoogle.push(googleOp)
        } else if (localOp.type === 'deleted') {
            deletedInLocal += 1
        } else if (localOp.lastModified.toMillis() >= googleOp.lastModified.toMillis()) {
            latestInLocal += 1
            // console.log('Latest in local!', localOp, googleOp)
        } else {
            latestInGoogle.push(googleOp)
        }
    }

    const syncStats = {
        matched,
        latestInGoogle: latestInGoogle.length,
        latestInLocal,
        missedInGoogle: localOpsMap.size,
        missedInLocal: missedInLocal.length,
        deletedInGoogle: deletedInGoogle.length,
        deletedInLocal
    }

    console.log('Operations Sync Result', syncStats)

    engine.pushOperations([...missedInLocal, ...latestInGoogle, ...deletedInGoogle])

    // if (latestInLocal > 0 || localOpsMap.size > 0 || deletedInLocal > 0) {
    //     await google.storeOperations(engine.operations, engine)
    // }

    return syncStats
}
