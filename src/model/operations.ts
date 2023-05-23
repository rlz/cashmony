import { makeAutoObservable, observable, runInAction, autorun } from 'mobx'
import { type NotDeletedOperation, type Operation, operationComparator } from './model'
import { FinDataDb } from './finDataDb'
import { Google } from '../google/google'
import deepEqual from 'fast-deep-equal'
import { utcToday } from '../helpers/dates'

let operationsModel: OperationsModel | null = null

export class OperationsModel {
    private readonly finDataDb = FinDataDb.instance()

    startDate = utcToday()
    operations: readonly Operation[] = []
    displayOperations: NotDeletedOperation[][] = []

    private constructor () {
        makeAutoObservable(this, {
            operations: observable.shallow
        })

        autorun(async () => {
            const upper = this.startDate
            const lower = upper.minus({ days: 60 })

            const ops = (await this.finDataDb.getOperations(lower, upper)).sort((o1, o2) => operationComparator(o2, o1))
            if (ops.length === 0) {
                runInAction(() => {
                    this.displayOperations = []
                })
                return
            }

            const displayOps: NotDeletedOperation[][] = [[]]
            let currentDateArray = displayOps[0]
            let currentDate = ops[0].date.toMillis()

            for (const o of ops) {
                if (o.date.toMillis() !== currentDate) {
                    currentDateArray = []
                    displayOps.push(currentDateArray)
                    currentDate = o.date.toMillis()
                }
                currentDateArray.push(o)
            }

            runInAction(() => {
                this.displayOperations = displayOps
            })
        })

        void this.readAll()
    }

    async getOperation (id: string): Promise<Operation> {
        return await this.finDataDb.getOperation(id)
    }

    static instance (): OperationsModel {
        if (operationsModel === null) {
            operationsModel = new OperationsModel()
        }

        return operationsModel
    }

    async put (ops: Operation[]): Promise<void> {
        if (ops.length === 0) {
            return
        }

        await this.finDataDb.putOperations(ops)
        await this.readAll()
    }

    private async readAll (): Promise<void> {
        const newOperations = await this.finDataDb.readAllOperations()
        newOperations.sort(operationComparator)

        runInAction(() => {
            this.operations = newOperations
        })
    }
}

const google = Google.instance()

export async function syncDataWithGoogle (): Promise<void> {
    await google.authenticate()
    await google.searchOrCreateDataSpreadsheet()
    const googleOps = await google.loadOperations()
    const localOps = operationsModel?.operations ?? []

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

    console.log('Sync Result', {
        matched,
        latestInGoogle: latestInGoogle.length,
        latestInLocal,
        missedInGoogle: localOpsMap.size,
        missedInLocal: missedInLocal.length,
        deletedInGoogle: deletedInGoogle.length,
        deletedInLocal
    })

    await operationsModel?.put([...missedInLocal, ...latestInGoogle, ...deletedInGoogle])

    if (latestInLocal > 0 || localOpsMap.size > 0 || deletedInLocal > 0) {
        await google.storeOperations(operationsModel?.operations ?? [])
    }
}
