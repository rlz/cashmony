import { type TransferOperation, type Operation, type ExpenseOperation, type NotDeletedOperation } from '../model/model'
import { fromGoogleDateTime, toGoogleDateTime } from '../helpers/dates'
import { assertGoogleOpsExtRow, assertGoogleOpsInitRow, isGoogleOpsDeletedRow, isGoogleOpsInitRow } from '../typeCheckers.g/google'

export type GoogleOpsInitRow = [
    string, // opId
    'adjustment' | 'transfer' | 'income' | 'expense', // opType
    number, // modified
    number, // date
    number, // amount
    string, // currency
    string, // account or category
    number, // account or category amount
    string?, // tags
    string? // comment
]

export type GoogleOpsExtRow = [
    string, // opId
    '', // opType
    '', // modified
    '', // date
    '', // amount
    '', // currency
    string, // account or category
    number // account or category amount
]

export type GoogleOpsDeletedRow = [
    string, // opId
    'deleted' // opType
]

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
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (isGoogleOpsDeletedRow(r)) {
            result.push({
                id: r[0],
                type: 'deleted'
            })
            // no ext lines after delete
            continue
        }

        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (baseOpInfo !== null && isGoogleOpsInitRow(r)) {
            makeOp()
        }

        if (baseOpInfo === null) {
            const row = assertGoogleOpsInitRow(r)

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
            const row = assertGoogleOpsExtRow(r)

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

            const row = assertGoogleOpsExtRow(r)

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
