import { Google } from '../google/google'
import { deepEqual } from '../helpers/deepEqual'
import { AccountsModel } from './accounts'
import { CategoriesModel } from './categories'
import { type Category, type Account, type Operation } from './model'
import { OperationsModel } from './operations'

const google = Google.instance()
const operationsModel = OperationsModel.instance()
const accountsModel = AccountsModel.instance()
const categoriesModel = CategoriesModel.instance()

export async function syncDataWithGoogle (): Promise<void> {
    await google.authenticate()
    await google.searchOrCreateDataSpreadsheet()
    await syncAccounts()
    await syncCategories()
    await syncOperations()
}

async function syncAccounts (): Promise<void> {
    const googleAccounts = await google.loadAccounts()
    const localAccounts = accountsModel.accounts

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

        if (deepEqual(googleAcc, localAcc)) {
            matched += 1
        } else if (localAcc.lastModified.toMillis() >= googleAcc.lastModified.toMillis()) {
            latestInLocal += 1
        } else {
            latestInGoogle.push(googleAcc)
        }
    }

    console.log('Accounts Sync Result', {
        matched,
        latestInGoogle: latestInGoogle.length,
        latestInLocal,
        missedInGoogle: localAccsMap.size,
        missedInLocal: missedInLocal.length
    })

    await Promise.all([...missedInLocal, ...latestInGoogle].map(async i => { await accountsModel.put(i) }))

    if (latestInLocal > 0 || localAccsMap.size > 0) {
        await google.storeAccounts([...accountsModel.accounts.values()])
    }
}

async function syncCategories (): Promise<void> {
    const googleCategories = await google.loadCategories()
    const localCategories = categoriesModel.categories

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

        if (deepEqual(googleCat, localCat)) {
            matched += 1
        } else if (localCat.lastModified.toMillis() >= googleCat.lastModified.toMillis()) {
            latestInLocal += 1
        } else {
            latestInGoogle.push(googleCat)
        }
    }

    console.log('Categories Sync Result', {
        matched,
        latestInGoogle: latestInGoogle.length,
        latestInLocal,
        missedInGoogle: localCatsMap.size,
        missedInLocal: missedInLocal.length
    })

    await Promise.all([...missedInLocal, ...latestInGoogle].map(async i => { await categoriesModel.put(i) }))

    if (latestInLocal > 0 || localCatsMap.size > 0) {
        await google.storeCategories([...categoriesModel.categories.values()])
    }
}

async function syncOperations (): Promise<void> {
    const googleOps = await google.loadOperations()
    const localOps = operationsModel.operations

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
        } else {
            latestInGoogle.push(googleOp)
        }
    }

    console.log('Operations Sync Result', {
        matched,
        latestInGoogle: latestInGoogle.length,
        latestInLocal,
        missedInGoogle: localOpsMap.size,
        missedInLocal: missedInLocal.length,
        deletedInGoogle: deletedInGoogle.length,
        deletedInLocal
    })

    await operationsModel.put([...missedInLocal, ...latestInGoogle, ...deletedInGoogle])

    if (latestInLocal > 0 || localOpsMap.size > 0 || deletedInLocal > 0) {
        await google.storeOperations(operationsModel.operations)
    }
}
