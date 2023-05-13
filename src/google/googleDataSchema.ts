import { z } from 'zod'
import { type TransferOperation, type Operation, type ExpenseOperation, type NotDeletedOperation } from '../model/operations'
import { fromGoogleDateTime, toGoogleDateTime } from '../helpers/dates'

const G_OPS_INIT_ROW_SCHEMA = z.tuple(
    [
        z.string(), // opId
        z.union([z.literal('adjustment'), z.literal('transfer'), z.literal('income'), z.literal('expense')]), // opType
        z.number(), // modified
        z.number(), // date
        z.number(), // amount
        z.string(), // currency
        z.string(), // account or category
        z.number(), // account or category amount
        z.string(), // tags
        z.string() // comment
    ]
)

const G_OPS_DELETED_ROW_SCHEMA = z.tuple(
    [
        z.string(), // opId
        z.literal('deleted') // opType
    ]
)

const G_OPS_INIT_ROW_READING_SCHEMA = z.union([
    G_OPS_INIT_ROW_SCHEMA,
    z.tuple([
        z.string(), // opId
        z.union([z.literal('adjustment'), z.literal('transfer'), z.literal('income'), z.literal('expense')]), // opType
        z.number(), // modified
        z.number(), // date
        z.number(), // amount
        z.string(), // currency
        z.string(), // account or category
        z.number(), // account or category amount
        z.string() // tags
    ]),
    z.tuple([
        z.string(), // opId
        z.union([z.literal('adjustment'), z.literal('transfer'), z.literal('income'), z.literal('expense')]), // opType
        z.number(), // modified
        z.number(), // date
        z.number(), // amount
        z.string(), // currency
        z.string(), // account or category
        z.number() // account or category amount
    ])
])

const G_OPS_EXT_ROW_SCHEMA = z.tuple(
    [
        z.string(), // opId
        z.literal(''), // opType
        z.literal(''), // modified
        z.literal(''), // date
        z.literal(''), // amount
        z.literal(''), // currency
        z.string(), // account or category
        z.number() // account or category amount
    ]
)

type GoogleOpsInitRow = z.infer<typeof G_OPS_INIT_ROW_SCHEMA>
type GoogleOpsExtRow = z.infer<typeof G_OPS_EXT_ROW_SCHEMA>
type GoogleOpsDeletedRow = z.infer<typeof G_OPS_DELETED_ROW_SCHEMA>
type GoogleOpsRow = GoogleOpsInitRow | GoogleOpsExtRow | GoogleOpsDeletedRow

export function opsToGoogle (ops: readonly Operation[]): GoogleOpsRow[] {
    const rows: GoogleOpsRow[] = []

    ops.forEach(o => {
        if (o.type === 'deleted') {
            rows.push([o.id, o.type])
            return
        }

        rows.push([
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
                rows.push([
                    o.id,
                    '',
                    '',
                    '',
                    '',
                    '',
                    c.name,
                    c.amount
                ])
            })
        }
        if ('toAccount' in o) {
            rows.push([
                o.id,
                '',
                '',
                '',
                '',
                '',
                o.toAccount.name,
                o.toAccount.amount
            ])
        }
    })

    return rows
}

export function opsFromGoogle (rows: unknown[]): Operation[] {
    const result: Operation[] = []

    let baseOpInfo: Omit<NotDeletedOperation, 'categories' | 'toAccount'> | null = null
    let toAccount: Pick<TransferOperation, 'toAccount'> | null = null
    let categories: Pick<ExpenseOperation, 'categories'> | null = null

    const makeOp = (): void => {
        if (baseOpInfo === null) {
            throw Error('Non null baseOpInfo expected here')
        }

        if (baseOpInfo.type === 'adjustment') {
            result.push({
                ...baseOpInfo,
                type: 'adjustment'
            })
        } else if (baseOpInfo.type === 'transfer') {
            if (toAccount === null) {
                throw Error('Non null toAccount expected here')
            }

            result.push({
                ...baseOpInfo,
                ...toAccount,
                type: 'transfer'
            })
        } else {
            if (categories === null) {
                throw Error('Non null categories expected here')
            }

            result.push({
                ...baseOpInfo,
                ...categories,
                type: baseOpInfo.type === 'expense' ? 'expense' : 'income'
            })
        }

        baseOpInfo = null
        toAccount = null
        categories = null
    }

    for (const r of rows) {
        if (baseOpInfo !== null && typeof r === 'object' && r !== null && 1 in r && r[1] !== '') {
            if (r[1] === 'deleted') {
                const row = G_OPS_DELETED_ROW_SCHEMA.parse(r)
                result.push({
                    id: row[0],
                    type: 'deleted'
                })
                continue
            }

            makeOp()
        }

        if (baseOpInfo === null) {
            const row = G_OPS_INIT_ROW_READING_SCHEMA.parse(r)
            baseOpInfo = {
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
                tags: (row[8] === undefined ? '' : row[8]).split(',').map(t => t.trim()).filter(t => t !== ''),
                comment: row[9] === undefined || row[9] === '' ? null : row[9]
            }

            if (baseOpInfo.type === 'expense' || baseOpInfo.type === 'income') {
                categories = {
                    categories: []
                }
            }
        } else if (baseOpInfo.type === 'transfer') {
            const row = G_OPS_EXT_ROW_SCHEMA.parse(r)

            toAccount = {
                toAccount: {
                    name: row[6],
                    amount: row[7]
                }
            }
        } else if (baseOpInfo.type === 'expense' || baseOpInfo.type === 'income') {
            if (categories === null) {
                throw Error('Non null category expected here')
            }

            const row = G_OPS_EXT_ROW_SCHEMA.parse(r)

            categories = {
                categories: [
                    ...categories.categories,
                    {
                        name: row[6],
                        amount: row[7]
                    }
                ]
            }
        }
    }

    if (baseOpInfo != null) {
        makeOp()
    }

    return result
}
