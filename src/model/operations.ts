import { DateTime } from 'luxon'
import { makeAutoObservable, observable, runInAction, autorun } from 'mobx'
import { FIN_DATA_DB } from './finDataDb'
import { type NotDeletedOperation, type Operation, operationComparator } from './model'

let operationsModel: OperationsModel | null = null

export class OperationsModel {
    startDate: DateTime
    operations: readonly Operation[] = []
    displayOperations: NotDeletedOperation[][] = []

    private constructor () {
        const now = DateTime.now()
        this.startDate = DateTime.utc(now.year, now.month, now.day)
        makeAutoObservable(this, {
            operations: observable.shallow
        })

        autorun(async () => {
            const upper = this.startDate
            const lower = upper.minus({ days: 60 })

            const ops = (await FIN_DATA_DB.getOperations(lower, upper)).sort((o1, o2) => operationComparator(o2, o1))
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

    get allExpenseTags (): string[] {
        const tags = new Map<string, number>()

        const x = (): void => {
            for (const [t, rank] of tags) {
                tags.set(t, rank * 0.99)
            }
        }

        this.operations.forEach(o => {
            x()
            if (o.type === 'expense') {
                o.tags.forEach(t => {
                    const rank = tags.get(t)
                    tags.set(t, (rank ?? 0) + 1)
                })
            }
        })

        return Array.from(tags.entries()).sort((e1, e2) => e2[1] - e1[1]).map(e => e[0])
    }

    async getOperation (id: string): Promise<Operation> {
        return await FIN_DATA_DB.getOperation(id)
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

        await FIN_DATA_DB.putOperations(ops)
        await this.readAll()
    }

    private async readAll (): Promise<void> {
        const newOperations = await FIN_DATA_DB.readAllOperations()
        newOperations.sort(operationComparator)

        runInAction(() => {
            this.operations = newOperations
        })
    }
}
