import { makeAutoObservable, observable, runInAction } from 'mobx'
import { type Operation, operationComparator, type NotDeletedOperation } from './model'
import { FinDataDb } from './finDataDb'

let operationsModel: OperationsModel | null = null

export class OperationsModel {
    private readonly finDataDb = FinDataDb.instance()

    operations: readonly Operation[] = []

    private constructor () {
        makeAutoObservable(this, {
            operations: observable.shallow
        })

        void this.readAll()
    }

    get firstOp (): NotDeletedOperation | undefined {
        for (const op of this.operations) {
            if (op.type !== 'deleted') {
                return op
            }
        }
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
