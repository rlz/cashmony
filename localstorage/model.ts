import { DateTime } from 'luxon'
import { match, P } from 'ts-pattern'
import { uuidv7 } from 'uuidv7'

import { Account, Category, Filter, NotDeletedOperation, Operation, Watch } from '../engine/model.js'

export interface IdbAccountV0 {
    readonly name: string
    readonly currency: string
    readonly hidden: boolean
    readonly deleted?: boolean
    readonly lastModified: number
}

export interface IdbAccountV1 extends IdbAccountV0 {
    id: string
}

export function accToIdb(account: Account): IdbAccountV1 {
    return {
        id: account.id,
        name: account.name,
        currency: account.currency,
        hidden: account.hidden,
        deleted: account.deleted,
        lastModified: account.lastModified.toMillis()!
    }
}

export function accFromIdb(account: IdbAccountV0 | IdbAccountV1): Account {
    const lastModified = DateTime.fromMillis(account.lastModified, { zone: 'utc' })

    if (!lastModified.isValid) {
        throw Error('Can not create DateTime: invalid millis')
    }

    return {
        id: 'id' in account ? account.id : uuidv7(),
        name: account.name,
        currency: account.currency,
        hidden: account.hidden,
        deleted: account.deleted,
        lastModified
    }
}

export interface IdbCategoryV0 {
    readonly name: string
    readonly lastModified: number
    readonly deleted?: boolean
    readonly perDayAmount?: number
    readonly currency?: string

    // deprecated
    readonly yearGoal?: number
    readonly yearGoalUsd?: number
    readonly hidden?: boolean
}

export interface IdbCategoryV1 extends IdbCategoryV0 {
    readonly id: string
}

export function catToIdb(category: Category): IdbCategoryV1 {
    return {
        id: category.id,
        name: category.name,
        lastModified: category.lastModified.toMillis(),
        deleted: category.deleted,
        perDayAmount: category.perDayAmount,
        currency: category.currency
    }
}

export function catFromIdb(category: IdbCategoryV0 | IdbCategoryV1): Category {
    const perDayAmount = match<IdbCategoryV0 | IdbCategoryV1, [number | undefined, string | undefined]>(category)
        .with({ perDayAmount: P.number, currency: P.string }, v => [v.perDayAmount, v.currency])
        .with({ yearGoalUsd: P.number }, v => [-v.yearGoalUsd / 365, 'USD'])
        .with({ yearGoal: P.number, currency: P.string }, v => [-v.yearGoal / 365, v.currency])
        .otherwise(() => [undefined, undefined])

    const lastModified = DateTime.fromMillis(category.lastModified, { zone: 'utc' })

    if (!lastModified.isValid) {
        throw Error('Can not create DateTime: invalid millis')
    }

    return {
        id: 'id' in category ? category.id : uuidv7(),
        name: category.name,
        lastModified,
        perDayAmount: perDayAmount[0],
        currency: perDayAmount[1],
        deleted: category.deleted
    }
}

export interface IdbExpensesGoalV0 extends IdbCategoryV0 {
    readonly perDayAmount: number
    readonly currency: string
    readonly filter: Filter
}

export interface IdbExpensesGoalV1 extends IdbExpensesGoalV0 {
    id: string
}

export function goalToIdb(goal: Watch): IdbExpensesGoalV1 {
    return {
        id: goal.id,
        name: goal.name,
        lastModified: goal.lastModified.toMillis(),
        deleted: goal.deleted,
        perDayAmount: goal.perDayAmount,
        currency: goal.currency,
        filter: goal.filter
    }
}

export function goalFromIdb(goal: IdbExpensesGoalV0 | IdbExpensesGoalV1): Watch {
    const lastModified = DateTime.fromMillis(goal.lastModified, { zone: 'utc' })

    if (!lastModified.isValid) {
        throw Error('Can not create DateTime: invalid millis')
    }

    return {
        id: 'id' in goal ? goal.id : uuidv7(),
        name: goal.name,
        lastModified,
        perDayAmount: goal.perDayAmount,
        currency: goal.currency,
        deleted: goal.deleted,
        filter: goal.filter
    }
}

interface IdbBaseTransactionV0 {
    readonly name: string
    readonly amount: number
}

export interface IdbBaseOperationV0 {
    readonly id: string
    readonly lastModified: number
    readonly date: number
    readonly currency: string
    readonly amount: number
    readonly tags: readonly string[]
    readonly comment: string | null
    readonly account: IdbBaseTransactionV0
}

export interface IdbIncomeOperationV0 extends IdbBaseOperationV0 {
    type: 'income'
    readonly categories: readonly IdbBaseTransactionV0[]
}

export interface IdbExpenseOperationV0 extends IdbBaseOperationV0 {
    type: 'expense'
    readonly categories: readonly IdbBaseTransactionV0[]
}

export interface IdbTransferOperationV0 extends IdbBaseOperationV0 {
    type: 'transfer'
    readonly toAccount: IdbBaseTransactionV0
}

export interface IdbAdjustmentOperationV0 extends IdbBaseOperationV0 {
    type: 'adjustment'
}

export interface IdbDeletedOperationV0 {
    readonly id: string
    readonly type: 'deleted'
}

export type IdbOperationV0 = IdbIncomeOperationV0 | IdbExpenseOperationV0 | IdbTransferOperationV0 | IdbAdjustmentOperationV0 | IdbDeletedOperationV0
export type IdbNotDeletedOperationV0 = Exclude<IdbOperationV0, IdbDeletedOperationV0>

interface IdbBaseTransactionV1 {
    readonly id: string
    readonly amount: number
}

export interface IdbBaseOperationV1 {
    readonly id: string
    readonly lastModified: number
    readonly date: number
    readonly currency: string
    readonly amount: number
    readonly tags: readonly string[]
    readonly comment: string | null
    readonly account: IdbBaseTransactionV1
}

export interface IdbIncomeOperationV1 extends IdbBaseOperationV1 {
    type: 'income'
    readonly categories: readonly IdbBaseTransactionV1[]
}

export interface IdbExpenseOperationV1 extends IdbBaseOperationV1 {
    type: 'expense'
    readonly categories: readonly IdbBaseTransactionV1[]
}

export interface IdbTransferOperationV1 extends IdbBaseOperationV1 {
    type: 'transfer'
    readonly toAccount: IdbBaseTransactionV1
}

export interface IdbAdjustmentOperationV1 extends IdbBaseOperationV1 {
    type: 'adjustment'
}

export interface IdbDeletedOperationV1 {
    readonly id: string
    readonly type: 'deleted'
}

export interface IdbDeletedOperationV2 extends IdbDeletedOperationV1 {
    readonly lastModified: number
}

export type IdbOperationV1 = IdbIncomeOperationV1 | IdbExpenseOperationV1 | IdbTransferOperationV1 | IdbAdjustmentOperationV1 | IdbDeletedOperationV1
export type IdbNotDeletedOperationV1 = Exclude<IdbOperationV2, IdbDeletedOperationV2>

export type IdbOperationV2 = IdbIncomeOperationV1 | IdbExpenseOperationV1 | IdbTransferOperationV1 | IdbAdjustmentOperationV1 | IdbDeletedOperationV2

export function opToIdb(o: Operation): IdbOperationV2 {
    if (o.type === 'deleted') {
        return {
            ...o,
            lastModified: o.lastModified.toMillis()
        }
    }

    return {
        ...o,
        lastModified: o.lastModified.toMillis(),
        date: o.date.toMillis()
    }
}

export function opFromIdbNoDeleted(o: IdbNotDeletedOperationV0 | IdbNotDeletedOperationV1, accountsMap: Record<string, string>, categoriesMap: Record<string, string>): NotDeletedOperation {
    const lastModified = DateTime.fromMillis(o.lastModified, { zone: 'utc' })

    if (!lastModified.isValid) {
        throw Error('Can not create DateTime: invalid millis')
    }

    const date = DateTime.fromMillis(o.date, { zone: 'utc' })

    if (!date.isValid) {
        throw Error('Can not create DateTime: invalid millis')
    }

    if (isV1Op(o)) {
        return {
            ...o,
            lastModified,
            date
        }
    }

    if (o.type === 'adjustment') {
        return {
            ...o,
            account: {
                id: accountsMap[o.account.name],
                amount: o.account.amount
            },
            lastModified,
            date
        }
    }

    if (o.type === 'income' || o.type === 'expense') {
        return {
            ...o,
            account: {
                id: accountsMap[o.account.name],
                amount: o.account.amount
            },
            categories: o.categories.map((c) => {
                return {
                    id: categoriesMap[c.name],
                    amount: c.amount
                }
            }),
            lastModified,
            date
        }
    }

    return {
        ...o,
        account: {
            id: accountsMap[o.account.name],
            amount: o.account.amount
        },
        toAccount: {
            id: accountsMap[o.toAccount.name],
            amount: o.toAccount.amount
        },
        lastModified,
        date
    }
}

function isV1Op(o: IdbNotDeletedOperationV0 | IdbNotDeletedOperationV1): o is IdbNotDeletedOperationV1 {
    return 'id' in o.account
}

export function opFromIdb(o: IdbOperationV0 | IdbOperationV1 | IdbOperationV2, accountsMap: Record<string, string>, categoriesMap: Record<string, string>): Operation {
    const lastModified = 'lastModified' in o ? DateTime.fromMillis(o.lastModified, { zone: 'utc' }) : DateTime.utc()

    if (!lastModified.isValid) {
        throw Error('Can not create DateTime: invalid millis')
    }

    if (o.type === 'deleted') {
        return {
            id: o.id,
            type: o.type,
            lastModified
        }
    }

    return opFromIdbNoDeleted(o, accountsMap, categoriesMap)
}
