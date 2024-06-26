import { DateTime } from 'luxon'

export interface Category {
    readonly id: string
    readonly name: string
    readonly lastModified: DateTime<true>
    readonly perDayAmount?: number
    readonly currency?: string
    readonly deleted?: boolean
}

export interface Account {
    readonly id: string
    readonly name: string
    readonly currency: string
    readonly hidden: boolean
    readonly deleted?: boolean
    readonly lastModified: DateTime<true>
}

type FilterMode = 'all' | 'selected' | 'exclude'

export interface Filter {
    search: string | null

    opTypeMode: FilterMode
    opType: readonly NotDeletedOperation['type'][]

    categoriesMode: FilterMode
    categories: readonly string[]

    accountsMode: FilterMode
    accounts: readonly string[]

    tagsMode: FilterMode
    tags: readonly string[]
}

export const DEFAULT_FILTER: Filter = {
    search: null,
    opTypeMode: 'selected',
    opType: ['expense', 'income', 'transfer', 'adjustment'],
    categoriesMode: 'all',
    categories: [],
    accountsMode: 'all',
    accounts: [],
    tagsMode: 'all',
    tags: []
}

export interface Watch extends Category {
    readonly perDayAmount: number
    readonly currency: string
    readonly filter: Filter
}

export interface BaseTransaction {
    readonly id: string
    readonly amount: number
}

interface BaseOperation {
    readonly id: string
    readonly lastModified: DateTime<true>
    readonly date: DateTime<true>
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
    readonly lastModified: DateTime<true>
}

export type Operation = IncomeOperation | ExpenseOperation | TransferOperation | AdjustmentOperation | DeletedOperation
export type NotDeletedOperation = Exclude<Operation, DeletedOperation>
