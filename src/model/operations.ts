import { DateTime } from 'luxon'
import { type Transaction } from '../google/google'
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

export type Operation = IncomeOperation | ExpenseOperation | TransferOperation | AdjustmentOperation

let operationsModel: OperationsModel | null = null

export class OperationsModel {
    startDate: DateTime
    operations: readonly Operation[] = []
    displayOperations: Operation[][] = []

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

            const displayOps: Operation[][] = [[]]
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

export function fromOldGoogle (transactions: readonly Transaction[]): Operation[] {
    console.log('fromGoogle: start')

    transactions = [...transactions]

    const result: Operation[] = []
    const transfers = new Map<string, Transaction>()

    for (const t of transactions) {
        if (t.budget === '_transfer') {
            const transferKey = `${t.date.toISODate() ?? 'null'}:${t.currency}${Math.abs(t.value)}`
            const t0 = transfers.get(transferKey)
            if (t0 === undefined) {
                transfers.set(transferKey, t)
            } else {
                transfers.delete(transferKey)
                if (t.value < 0) {
                    result.push({
                        id: t.id,
                        lastModified: DateTime.now(),
                        date: t.date,
                        currency: t.currency,
                        amount: Math.abs(t.value),
                        tags: t.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
                        comment: t.comment === '' ? null : t.comment,
                        account: {
                            name: t.account,
                            amount: t.accountValue
                        },
                        type: 'transfer',
                        toAccount: {
                            name: t0.account,
                            amount: t0.accountValue
                        }
                    })
                } else {
                    result.push({
                        id: t.id,
                        lastModified: DateTime.now(),
                        date: t.date,
                        currency: t.currency,
                        amount: Math.abs(t.value),
                        tags: t.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
                        comment: t.comment === '' ? null : t.comment,
                        account: {
                            name: t0.account,
                            amount: t0.accountValue
                        },
                        type: 'transfer',
                        toAccount: {
                            name: t.account,
                            amount: t.accountValue
                        }
                    })
                }
            }
            continue
        }

        if (t.budget === '_recon') {
            result.push({
                id: t.id,
                lastModified: DateTime.now(),
                date: t.date,
                currency: t.currency,
                amount: t.value,
                tags: t.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
                comment: t.comment === '' ? null : t.comment,
                account: {
                    name: t.account,
                    amount: t.accountValue
                },
                type: 'adjustment'
            })
        }

        if (t.value > 0) {
            result.push({
                id: t.id,
                lastModified: DateTime.now(),
                date: t.date,
                currency: t.currency,
                amount: t.value,
                tags: t.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
                comment: t.comment === '' ? null : t.comment,
                account: {
                    name: t.account,
                    amount: t.accountValue
                },
                type: 'income',
                categories: []
            })
        } else {
            result.push({
                id: t.id,
                lastModified: DateTime.now(),
                date: t.date,
                currency: t.currency,
                amount: t.value,
                tags: t.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
                comment: t.comment === '' ? null : t.comment,
                account: {
                    name: t.account,
                    amount: t.accountValue
                },
                type: 'expense',
                categories: [
                    {
                        name: t.budget ?? '_unknown',
                        amount: t.budgetValue ?? 0
                    }
                ]
            })
        }
    }

    if (transfers.size !== 0) {
        const ser = [...transfers.values()]
            .map(v => JSON.stringify(v, undefined, 2))
            .join('\n\n')
        throw Error(`Unpaired transfers:\n${ser}\n---`)
    }

    console.log('fromGoogle: end')
    return result
}

const OP_WEIGHTS = {
    income: 0,
    transfer: 1,
    expense: 2,
    adjustment: 3
}

function operationComparator (o1: Operation, o2: Operation): number {
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
