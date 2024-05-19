import { DateTime } from 'luxon'
import { match } from 'ts-pattern'
import { uuidv7 } from 'uuidv7'
import { z } from 'zod'

import { Engine } from '../engine/engine'
import { Account, Category, DEFAULT_FILTER, Filter, Operation, Watch } from '../engine/model'
import { fromGoogleDateTime, toGoogleDateTime } from './dates'

const GoogleNonDeletedOperationRowSchema = z.union([
    z.tuple([
        z.string(), // opId
        z.union([
            z.literal('adjustment'),
            z.literal('transfer'),
            z.literal('income'),
            z.literal('expense')
        ]), // opType
        z.number(), // modified
        z.number(), // date
        z.number(), // amount
        z.string(), // currency
        z.string(), // account
        z.number() // account amount
    ]),
    z.tuple([
        z.string(), // opId
        z.union([
            z.literal('adjustment'),
            z.literal('transfer'),
            z.literal('income'),
            z.literal('expense')
        ]), // opType
        z.number(), // modified
        z.number(), // date
        z.number(), // amount
        z.string(), // currency
        z.string(), // account
        z.number(), // account amount
        z.string() // tags
    ]),
    z.tuple([
        z.string(), // opId
        z.union([
            z.literal('adjustment'),
            z.literal('transfer'),
            z.literal('income'),
            z.literal('expense')
        ]), // opType
        z.number(), // modified
        z.number(), // date
        z.number(), // amount
        z.string(), // currency
        z.string(), // account
        z.number(), // account amount
        z.string().optional(), // tags
        z.string() // comment
    ])
])

export type GoogleNonDeletedOperationRow = z.infer<typeof GoogleNonDeletedOperationRowSchema>

const GoogleDeletedOperationRowSchema = z.tuple([
    z.string(), // opId
    z.literal('deleted') // opType
])

export type GoogleDeletedOperationRow = z.infer<typeof GoogleDeletedOperationRowSchema>

type GoogleOperationRow = GoogleNonDeletedOperationRow | GoogleDeletedOperationRow

const GoogleOperationCategoryRowSchema = z.tuple([
    z.string(), // opId
    z.string(), // categoryName
    z.number() // categoryAmount
])

export type GoogleOperationCategoryRow = z.infer<typeof GoogleOperationCategoryRowSchema>

const GoogleCategoryRowSchemaV1 = z.union([
    z.tuple([
        z.string(), // name
        z.string(), // currency
        z.number(), // lastModified
        z.union([z.number(), z.literal('')]), // yearGoalUsd — not used
        z.union([z.literal('yes'), z.literal('no')]) // hidden — not used
    ]),
    z.tuple([
        z.string(), // name
        z.string(), // currency
        z.number(), // lastModified
        z.union([z.number(), z.literal('')]), // yearGoalUsd — not used
        z.union([z.literal('yes'), z.literal('no')]), // hidden
        z.union([z.literal('yes'), z.literal('no')]) // deleted
    ])
])

const GoogleCategoryRowSchemaV2 = z.tuple([
    z.string(), // name
    z.string(), // currency
    z.number(), // lastModified
    z.literal(''), // yearGoalUsd — not used
    z.literal(''), // hidden - not used
    z.union([z.literal('yes'), z.literal('no'), z.literal('')]), // deleted
    z.union([z.number(), z.literal('-')]) // perDayGoal
])

type GoogleCategoryRowV2 = z.infer<typeof GoogleCategoryRowSchemaV2>

const googleGoalRowSchemaV1 = z.tuple([
    z.string(), // name
    z.number(), // lastModified
    z.union([z.literal('yes'), z.literal('no'), z.literal('')]), // deleted
    z.union([z.literal('yes'), z.literal('no')]), // isRegular
    z.string(), // filter
    z.number(), // perDayGoal.value
    z.string() // perDayGoal.currency
])

type GoogleGoalRowV1 = z.infer<typeof googleGoalRowSchemaV1>

const GoogleAccountRowSchema = z.union([
    z.tuple([
        z.string(), // name
        z.string(), // currency
        z.number(), // lastModified
        z.union([z.literal('yes'), z.literal('no')]) // hidden
    ]),
    z.tuple([
        z.string(), // name
        z.string(), // currency
        z.number(), // lastModified
        z.union([z.literal('yes'), z.literal('no')]), // hidden
        z.union([z.literal('yes'), z.literal('no')]).optional() // deleted
    ])
    // z.tuple([
    //     z.string(), // name
    //     z.string(), // currency
    //     z.number(), // lastModified
    //     z.union([z.literal('yes'), z.literal('no')]), // hidden
    //     z.enum(['yes', 'no', '']), // deleted
    //     z.string() // id
    // ])
])

export type GoogleAccountRow = z.infer<typeof GoogleAccountRowSchema>

export interface GoogleOperationsInfo {
    operations: GoogleOperationRow[]
    categories: GoogleOperationCategoryRow[]
}

export function opsToGoogle(ops: readonly Operation[], engine: Engine): GoogleOperationsInfo {
    const operations: GoogleOperationRow[] = []
    const categories: GoogleOperationCategoryRow[] = []

    ops.forEach((o) => {
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
            engine.getAccount(o.account.id).name,
            o.account.amount,
            o.tags.join(', '),
            o.comment ?? ''
        ])
        if ('categories' in o) {
            o.categories.forEach((c) => {
                categories.push([
                    o.id,
                    engine.getCategory(c.id).name,
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
                engine.getAccount(o.toAccount.id).name,
                o.toAccount.amount,
                o.tags.join(', '),
                o.comment ?? ''
            ])
        }
    })

    return { operations, categories }
}

export function opsFromGoogle(googleRows: { operations: unknown[], categories: unknown[] }, engine: Engine): Operation[] {
    const result: Operation[] = []

    const categories = new Map<string, Array<{ name: string, amount: number }>>()

    for (const row of googleRows.categories) {
        const r = GoogleOperationCategoryRowSchema.safeParse(row)
        if (r.success) {
            const [opId, name, amount] = r.data
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

        const dr = GoogleDeletedOperationRowSchema.safeParse(row)
        if (dr.success) {
            result.push({
                id: dr.data[0],
                type: 'deleted',
                lastModified: DateTime.utc()
            })
            continue
        }

        const ndr = GoogleNonDeletedOperationRowSchema.safeParse(row)
        if (!ndr.success) {
            throw Error(`Unexpected data in row (Operation): ${JSON.stringify(row)}`)
        }

        if (ndr.data[1] === 'transfer') {
            i += 1
            const toAccountRow = GoogleNonDeletedOperationRowSchema.safeParse(googleRows.operations[i])
            if (!toAccountRow.success) {
                throw Error(`Unexpected data in row (Operation) - after transfer row: ${JSON.stringify(googleRows.operations[i])}`)
            }
            if (ndr.data[0] !== toAccountRow.data[0]) {
                throw Error(`Transfer row should go one by one, but found:\n${ndr.data.join(', ')}\n${toAccountRow.data.join(', ')}`)
            }
            result.push({
                id: ndr.data[0],
                type: 'transfer',
                lastModified: fromGoogleDateTime(ndr.data[2]),
                date: fromGoogleDateTime(ndr.data[3]),
                amount: ndr.data[4],
                currency: ndr.data[5],
                account: {
                    id: engine.getAccountByName(ndr.data[6]).id,
                    amount: ndr.data[7]
                },
                toAccount: {
                    id: engine.getAccountByName(toAccountRow.data[6]).id,
                    amount: toAccountRow.data[7]
                },
                tags: (ndr.data[8] ?? '').split(',').map(t => t.trim()).filter(t => t !== ''),
                comment: (ndr.data[9] === undefined || ndr.data[9] === '') ? null : ndr.data[9]
            })
            continue
        }

        if (ndr.data[1] === 'adjustment') {
            result.push({
                id: ndr.data[0],
                type: 'adjustment',
                lastModified: fromGoogleDateTime(ndr.data[2]),
                date: fromGoogleDateTime(ndr.data[3]),
                amount: ndr.data[4],
                currency: ndr.data[5],
                account: {
                    id: engine.getAccountByName(ndr.data[6]).id,
                    amount: ndr.data[7]
                },
                tags: (ndr.data[8] ?? '').split(',').map(t => t.trim()).filter(t => t !== ''),
                comment: (ndr.data[9] === undefined || ndr.data[9] === '') ? null : ndr.data[9]
            })
            continue
        }

        result.push({
            id: ndr.data[0],
            type: ndr.data[1],
            lastModified: fromGoogleDateTime(ndr.data[2]),
            date: fromGoogleDateTime(ndr.data[3]),
            amount: ndr.data[4],
            currency: ndr.data[5],
            account: {
                id: engine.getAccountByName(ndr.data[6]).id,
                amount: ndr.data[7]
            },
            categories: (categories.get(ndr.data[0]) ?? []).map((c) => {
                return {
                    id: engine.getCategoryByName(c.name).id,
                    amount: c.amount
                }
            }),
            tags: (ndr.data[8] ?? '').split(',').map(t => t.trim()).filter(t => t !== ''),
            comment: (ndr.data[9] === undefined || ndr.data[9] === '') ? null : ndr.data[9]
        })
    }

    return result
}

export function catsToGoogle(categories: readonly Category[]): GoogleCategoryRowV2[] {
    return categories.map((c) => {
        return [
            c.name,
            c.currency ?? '-',
            toGoogleDateTime(c.lastModified),
            '',
            '',
            c.deleted === true ? 'yes' : (c.deleted === false ? 'no' : ''),
            c.perDayAmount ?? '-'
        ]
    })
}

export function catsFromGoogle(rows: unknown[], engine: Engine): Category[] {
    const catsByName = Object.fromEntries(engine.categories.map(i => [i.name, i]))

    return rows.map((row): Category => {
        const r1 = GoogleCategoryRowSchemaV1.safeParse(row)
        if (r1.success) {
            const id = engine.hasCategoryWithName(r1.data[0])
                ? engine.getCategoryByName(r1.data[0]).id
                : uuidv7()

            return {
                id,
                name: r1.data[0],
                currency: r1.data[1] === '-' ? undefined : r1.data[1],
                lastModified: fromGoogleDateTime(r1.data[2]),
                deleted: r1.data[5] === 'yes' ? true : (r1.data[5] === 'no' ? false : undefined)
            }
        }

        const r2 = GoogleCategoryRowSchemaV2.safeParse(row)
        if (r2.success) {
            const id = catsByName[r2.data[0]]?.id ?? uuidv7()

            return {
                id,
                name: r2.data[0],
                currency: r2.data[1] === '-' ? undefined : r2.data[1],
                lastModified: fromGoogleDateTime(r2.data[2]),
                deleted: r2.data[5] === 'yes' ? true : (r2.data[5] === 'no' ? false : undefined),
                perDayAmount: r2.data[6] === '-' ? undefined : r2.data[6]
            }
        }

        throw Error(`Unexpected data in row (Category): ${JSON.stringify(row)}`)
    })
}

export function goalsToGoogle(goals: readonly Watch[], engine: Engine): GoogleGoalRowV1[] {
    return goals.map((i) => {
        const filter = {
            ...i.filter,
            categories: i.filter.categories.map(c => engine.getCategory(c).name),
            accounts: i.filter.accounts.map(c => engine.getAccount(c).name)
        }

        return [
            i.name,
            toGoogleDateTime(i.lastModified),
            i.deleted === true ? 'yes' : (i.deleted === false ? 'no' : ''),
            'no',
            JSON.stringify(filter),
            i.perDayAmount,
            i.currency
        ]
    })
}

const filterModeSchema = z.enum(['all', 'selected', 'exclude'])

const filterSchema = z.object({
    search: z.string().nullable(),

    opTypeMode: filterModeSchema,
    opType: z.array(z.enum(['expense', 'income', 'transfer', 'adjustment'])).readonly(),

    categoriesMode: filterModeSchema,
    categories: z.array(z.string()).readonly(),

    accountsMode: filterModeSchema,
    accounts: z.array(z.string()).readonly(),

    tagsMode: filterModeSchema,
    tags: z.array(z.string()).readonly()
})

export function goalsFromGoogle(rows: unknown[], engine: Engine): Watch[] {
    const watchesByName = Object.fromEntries(engine.watches.map(i => [i.name, i]))

    return rows.map((row) => {
        const parsed = googleGoalRowSchemaV1.parse(row)
        const id = watchesByName[parsed[0]]?.id ?? uuidv7()

        const filter: Filter = (() => {
            if (parsed[2] === 'yes') {
                return DEFAULT_FILTER
            }

            const gFilter = filterSchema.parse(JSON.parse(parsed[4]))

            try {
                return {
                    ...gFilter,
                    categories: gFilter.categories.map(c => engine.getCategoryByName(c).id),
                    accounts: gFilter.accounts.map(a => engine.getAccountByName(a).id)
                }
            } catch (e) {
                throw Error(`Problem with filter of ${parsed[0]} watch`, { cause: e })
            }
        })()

        return {
            id,
            name: parsed[0],
            lastModified: fromGoogleDateTime(parsed[1]),
            deleted: match(parsed[2]).with('yes', () => true).with('no', () => false).otherwise(() => undefined),
            filter,
            perDayAmount: parsed[5],
            currency: parsed[6]
        }
    })
}

export function accsToGoogle(accounts: readonly Account[]): GoogleAccountRow[] {
    return accounts.map((a) => {
        return [
            a.name,
            a.currency,
            toGoogleDateTime(a.lastModified),
            a.hidden ? 'yes' : 'no',
            a.deleted === true ? 'yes' : (a.deleted === false ? 'no' : undefined)
            // a.id
        ]
    })
}

export function accsFromGoogle(rows: unknown[], engine: Engine): Account[] {
    const accountsByName = Object.fromEntries(engine.accounts.map(i => [i.name, i]))

    return rows.map((row) => {
        const r = GoogleAccountRowSchema.safeParse(row)
        if (!r.success) {
            throw Error(`Unexpected data in row (Category): ${JSON.stringify(row)}`)
        }

        // const id = r.data.length === 6
        //     ? r.data[5]
        //     : (
        //             engine.hasAccountWithName(r.data[0])
        //                 ? engine.getAccountByName(r.data[0]).id
        //                 : uuidv7()
        //         )
        const id = accountsByName[r.data[0]]?.id ?? uuidv7()

        return {
            id,
            name: r.data[0],
            currency: r.data[1],
            lastModified: fromGoogleDateTime(r.data[2]),
            hidden: r.data[3] === 'yes',
            deleted: r.data[4] === 'yes' ? true : (r.data[4] === 'no' ? false : undefined)
        }
    })
}
