import { makeAutoObservable, observable, runInAction, autorun } from 'mobx'
import { type NotDeletedOperation, type Operation, operationComparator } from './model'
import { FinDataDb } from './finDataDb'
import { type DateTime } from 'luxon'
import { AppState } from './appState'

const appState = AppState.instance()

let operationsModel: OperationsModel | null = null

export class OperationsModel {
    private readonly finDataDb = FinDataDb.instance()

    operations: readonly Operation[] = []
    displayOperations: readonly NotDeletedOperation[][] = []

    private constructor () {
        makeAutoObservable(this, {
            operations: observable.shallow
        })

        autorun(async () => {
            await this.readDisplayOps(appState.startDate)
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
        await this.readDisplayOps(appState.startDate)
    }

    private async readAll (): Promise<void> {
        const newOperations = await this.finDataDb.readAllOperations()
        newOperations.sort(operationComparator)

        runInAction(() => {
            this.operations = newOperations
        })
    }

    private async readDisplayOps (startDate: DateTime): Promise<void> {
        const upper = startDate
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
    }
}
