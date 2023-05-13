import { DateTime } from 'luxon'
import { makeAutoObservable, observable, runInAction, autorun } from 'mobx'
import { FIN_DATA_DB } from './finDataDb'

export interface Category {
    readonly name: string
    readonly currency: string
}

export interface Account {
    readonly name: string
    readonly currency: string
}

interface BaseTransaction {
    readonly name: string
    readonly amount: number
}

interface BaseOperation {
    readonly id: string
    readonly lastModified: DateTime
    readonly date: DateTime
    readonly currency: string
    readonly amount: number
    readonly tags: readonly string[]
    readonly comment: string | null
    readonly account: BaseTransaction
}

export interface IncomeOperation extends BaseOperation {
    type: 'income'
    readonly categories: readonly BaseTransaction[]
}

export interface ExpenseOperation extends BaseOperation {
    type: 'expense'
    readonly categories: readonly BaseTransaction[]
}

export interface TransferOperation extends BaseOperation {
    type: 'transfer'
    readonly toAccount: BaseTransaction
}

export interface AdjustmentOperation extends BaseOperation {
    type: 'adjustment'
}

export interface DeletedOperation {
    readonly id: string
    readonly type: 'deleted'
}

export type Operation = IncomeOperation | ExpenseOperation | TransferOperation | AdjustmentOperation | DeletedOperation
export type NotDeletedOperation = Exclude<Operation, DeletedOperation>

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

const OP_WEIGHTS = {
    income: 0,
    transfer: 1,
    expense: 2,
    adjustment: 3
}

function operationComparator (o1: Operation, o2: Operation): number {
    if (o1.type === 'deleted' && o2.type === 'deleted') {
        return o1.id < o2.id ? -1 : 1
    }

    if (o1.type === 'deleted') {
        return -1
    }

    if (o2.type === 'deleted') {
        return 1
    }

    const d = o1.date.toMillis() - o2.date.toMillis()
    if (d !== 0) {
        return d
    }

    const op = OP_WEIGHTS[o1.type] - OP_WEIGHTS[o2.type]
    if (op !== 0) {
        return op
    }

    if (o1.currency !== o2.currency) {
        return o1.currency < o2.currency ? -1 : 1
    }

    const amount = Math.abs(o1.amount) - Math.abs(o2.amount)
    if (amount !== 0) {
        return amount
    }

    return o1.id < o2.id ? 1 : (o1.id === o2.id ? 0 : -1)
}
