import { makeAutoObservable, observable, runInAction } from 'mobx'

import { FinDataDb } from './finDataDb'
import { type NotDeletedOperation, type Operation, operationComparator } from './model'

const finDataDb = FinDataDb.instance()
let operationsModel: OperationsModel | null = null

export class OperationsModel {
    operations: readonly Operation[] | null = null

    private constructor () {
        makeAutoObservable(this, {
            operations: observable.shallow
        })

        void this.readAll()
    }

    get firstOp (): NotDeletedOperation | undefined {
        if (this.operations === null) {
            throw Error('Operations not loaded')
        }

        for (const op of this.operations) {
            if (op.type !== 'deleted') {
                return op
            }
        }
    }

    get lastOp (): NotDeletedOperation | undefined {
        if (this.operations === null) {
            throw Error('Operations not loaded')
        }

        const op = this.operations[this.operations.length - 1]

        if (op.type !== 'deleted') {
            return op
        }
    }

    async getOperation (id: string): Promise<Operation> {
        return await finDataDb.getOperation(id)
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

        await finDataDb.putOperations(ops)
        await this.readAll()
    }

    private async readAll (): Promise<void> {
        const newOperations = await finDataDb.readAllOperations()
        newOperations.sort(operationComparator)

        runInAction(() => {
            this.operations = newOperations
        })
    }
}
