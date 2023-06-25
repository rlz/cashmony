import { type ExpensesGoal, type Account, type Category, type Operation } from '../model/model'
import { fromGoogleDateTime, toGoogleDateTime } from '../helpers/dates'
import { assertGoogleNonDeletedOperationRow, isGoogleAccountRow, isGoogleCategoryRow, isGoogleDeletedOperationRow, isGoogleNonDeletedOperationRow, isGoogleOperationCategoryRow } from '../typeCheckers.g/google'
import { z } from 'zod'
import { match } from 'ts-pattern'
import { filterSchema } from '../model/filter'

export type GoogleNonDeletedOperationRow = [
    string, // opId
    'adjustment' | 'transfer' | 'income' | 'expense', // opType
    number, // modified
    number, // date
    number, // amount
    string, // currency
    string, // account
    number, // account amount
    string?, // tags
    string? // comment
]

export type GoogleDeletedOperationRow = [
    string, // opId
    'deleted' // opType
]

type GoogleOperationRow = GoogleNonDeletedOperationRow | GoogleDeletedOperationRow

export type GoogleOperationCategoryRow = [
    string, // opId
    string, // categoryName
    number // categoryAmount
]

export type GoogleCategoryRow = [
    string, // name
    string, // currency
    number, // lastModified
    number | '', // yearGoalUsd
    'yes' | 'no', // hidden
    ('yes' | 'no')? // deleted
]

const googleGoalRowSchema = z.tuple([
    z.string(), // name
    z.number(), // lastModified
    z.union([z.literal('yes'), z.literal('no'), z.literal('')]), // deleted
    z.union([z.literal('yes'), z.literal('no')]), // isRegular
    z.string(), // filter
    z.number(), // perDayGoal.value
    z.string() // perDayGoal.currency
])

type GoogleGoalRow = z.infer<typeof googleGoalRowSchema>

export type GoogleAccountRow = [
    string, // name
    string, // currency
    number, // lastModified
    'yes' | 'no', // hidden
    ('yes' | 'no')? // deleted
]

export interface GoogleOperationsInfo {
    operations: GoogleOperationRow[]
    categories: GoogleOperationCategoryRow[]
}

export function opsToGoogle (ops: readonly Operation[]): GoogleOperationsInfo {
    const operations: GoogleOperationRow[] = []
    const categories: GoogleOperationCategoryRow[] = []

    ops.forEach(o => {
        if (o.type === 'deleted') {
            operations.push([o.id, o.type])
            return
        }

        operations.push([
            o.id,
            o.type,
            toGoogleDateTime(o.lastModified),
            toGoogleDateTime(o.date),
            o.amount,
            o.currency,
            o.account.name,
            o.account.amount,
            o.tags.join(', '),
            o.comment ?? ''
        ])
        if ('categories' in o) {
            o.categories.forEach(c => {
                categories.push([
                    o.id,
                    c.name,
                    c.amount
                ])
            })
        }
        if ('toAccount' in o) {
            operations.push([
                o.id,
                o.type,
                toGoogleDateTime(o.lastModified),
                toGoogleDateTime(o.date),
                o.amount,
                o.currency,
                o.toAccount.name,
                o.toAccount.amount,
                o.tags.join(', '),
                o.comment ?? ''
            ])
        }
    })

    return { operations, categories }
}

export function opsFromGoogle (googleRows: { operations: unknown[], categories: unknown[] }): Operation[] {
    const result: Operation[] = []

    const categories = new Map<string, Array<{ name: string, amount: number }>>()

    for (const row of googleRows.categories) {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (isGoogleOperationCategoryRow(row)) {
            const [opId, name, amount] = row
            let cats = categories.get(opId)
            if (cats === undefined) {
                cats = []
                categories.set(opId, cats)
            }
            cats.push({ name, amount })
            continue
        }

        throw Error(`Unexpected data in row (Operation - Category): ${JSON.stringify(row)}`)
    }

    for (let i = 0; i < googleRows.operations.length; ++i) {
        const row = googleRows.operations[i]

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (isGoogleDeletedOperationRow(row)) {
            result.push({
                id: row[0],
                type: 'deleted'
            })
            continue
        }

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!isGoogleNonDeletedOperationRow(row)) {
            throw Error(`Unexpected data in row (Operation): ${JSON.stringify(row)}`)
        }

        if (row[1] === 'transfer') {
            i += 1
            const toAccountRow = assertGoogleNonDeletedOperationRow(googleRows.operations[i])
            if (row[0] !== toAccountRow[0]) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw Error(`Transfer row should go one by one, but found:\n${row.join(', ')}\n${toAccountRow.join(', ')}`)
            }
            result.push({
                id: row[0],
                type: 'transfer',
                lastModified: fromGoogleDateTime(row[2]),
                date: fromGoogleDateTime(row[3]),
                amount: row[4],
                currency: row[5],
                account: {
                    name: row[6],
                    amount: row[7]
                },
                toAccount: {
                    name: toAccountRow[6],
                    amount: toAccountRow[7]
                },
                tags: (row[8] ?? '').split(',').map(t => t.trim()).filter(t => t !== ''),
                comment: (row[9] === undefined || row[9] === '') ? null : row[9]
            })
            continue
        }

        if (row[1] === 'adjustment') {
            result.push({
                id: row[0],
                type: 'adjustment',
                lastModified: fromGoogleDateTime(row[2]),
                date: fromGoogleDateTime(row[3]),
                amount: row[4],
                currency: row[5],
                account: {
                    name: row[6],
                    amount: row[7]
                },
                tags: (row[8] ?? '').split(',').map(t => t.trim()).filter(t => t !== ''),
                comment: (row[9] === undefined || row[9] === '') ? null : row[9]
            })
            continue
        }

        result.push({
            id: row[0],
            type: row[1],
            lastModified: fromGoogleDateTime(row[2]),
            date: fromGoogleDateTime(row[3]),
            amount: row[4],
            currency: row[5],
            account: {
                name: row[6],
                amount: row[7]
            },
            categories: categories.get(row[0]) ?? [],
            tags: (row[8] ?? '').split(',').map(t => t.trim()).filter(t => t !== ''),
            comment: (row[9] === undefined || row[9] === '') ? null : row[9]
        })
    }

    return result
}

export function catsToGoogle (categories: readonly Category[]): GoogleCategoryRow[] {
    return categories.map(c => {
        return [
            c.name,
            '', // currency was here
            toGoogleDateTime(c.lastModified),
            c.yearGoalUsd === undefined ? '' : c.yearGoalUsd,
            c.hidden ? 'yes' : 'no',
            c.deleted === true ? 'yes' : (c.deleted === false ? 'no' : undefined)
        ]
    })
}

export function catsFromGoogle (rows: unknown[]): Category[] {
    return rows.map(row => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!isGoogleCategoryRow(row)) {
            throw Error(`Unexpected data in row (Category): ${JSON.stringify(row)}`)
        }

        return {
            name: row[0],
            lastModified: fromGoogleDateTime(row[2]),
            yearGoalUsd: row[3] === '' ? undefined : row[3],
            hidden: row[4] === 'yes',
            deleted: row[5] === 'yes' ? true : (row[5] === 'no' ? false : undefined)
        }
    })
}

export function goalsToGoogle (goals: readonly ExpensesGoal[]): GoogleGoalRow[] {
    return goals.map(i => {
        return [
            i.name,
            toGoogleDateTime(i.lastModified),
            i.deleted === true ? 'yes' : (i.deleted === false ? 'no' : ''),
            i.isRegular ? 'yes' : 'no',
            JSON.stringify(i.filter),
            i.perDayAmount,
            i.currency
        ]
    })
}

export function goalsFromGoogle (rows: unknown[]): ExpensesGoal[] {
    return rows.map(row => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        const parsed = googleGoalRowSchema.parse(row)

        return {
            name: parsed[0],
            lastModified: fromGoogleDateTime(parsed[1]),
            deleted: match(parsed[2]).with('yes', () => true).with('no', () => false).otherwise(() => undefined),
            isRegular: match(parsed[3]).with('yes', () => true).otherwise(() => false),
            filter: filterSchema.parse(JSON.parse(parsed[4])),
            perDayAmount: parsed[5],
            currency: parsed[6]
        }
    })
}

export function accsToGoogle (accounts: readonly Account[]): GoogleAccountRow[] {
    return accounts.map(a => {
        return [
            a.name,
            a.currency,
            toGoogleDateTime(a.lastModified),
            a.hidden ? 'yes' : 'no',
            a.deleted === true ? 'yes' : (a.deleted === false ? 'no' : undefined)
        ]
    })
}

export function accsFromGoogle (rows: unknown[]): Account[] {
    return rows.map(row => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (!isGoogleAccountRow(row)) {
            throw Error(`Unexpected data in row (Category): ${JSON.stringify(row)}`)
        }

        return {
            name: row[0],
            currency: row[1],
            lastModified: fromGoogleDateTime(row[2]),
            hidden: row[3] === 'yes',
            deleted: row[4] === 'yes' ? true : (row[4] === 'no' ? false : undefined)
        }
    })
}
