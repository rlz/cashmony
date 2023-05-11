import { z } from 'zod'
import { isOk, type Google } from './google'
import makeUrl from './makeUrl'
import { runInAction } from 'mobx'
import { fromGoogleDateTime } from '../helpers/dates'

export async function loadTransactions (google: Google): Promise<void> {
    console.log('Loading transactions')
    if (google.finDataSpreadsheetId === null) {
        throw Error(`finDataSpreadsheetId(${google.finDataSpreadsheetId ?? 'null'}) expected here`)
    }

    const id = encodeURIComponent(google.finDataSpreadsheetId)
    const range = encodeURIComponent('Transactions!R2C1:R20000C11')
    const reply = await google.fetch(
        makeUrl(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}`, {
            valueRenderOption: 'UNFORMATTED_VALUE'
        })
    )
    if (isOk(reply)) {
        const values = GOOGLE_TRANSACTIONS_DATA_SCHEMA.parse(reply.body).values
        runInAction(() => {
            google.transactions = values.map((vs, index) => {
                return {
                    row: index + 2,
                    id: vs[0],
                    modified: fromGoogleDateTime(vs[1]),
                    date: fromGoogleDateTime(vs[2]),
                    value: vs[3],
                    currency: vs[4],
                    account: vs[5],
                    accountValue: vs[6],
                    budget: vs[7] === '' ? null : vs[7],
                    budgetValue: vs[8] !== '' ? (vs[8] ?? null) : null,
                    tags: vs[9] ?? '',
                    comment: vs[10] ?? ''
                }
            })

            console.log(`${values.length} transactions loaded`)
        })
    } else {
        console.warn('Unauthorized!')
    }
}

const GOOGLE_TRANSACTIONS_DATA_SCHEMA = z.object({
    values: z.array(
        z.union(
            [
                z.tuple(
                    [
                        z.string(), // Id
                        z.number(), // Modified
                        z.number(), // Date
                        z.number(), // Value
                        z.string(), // Currency
                        z.string(), // Account
                        z.number(), // Account Value
                        z.string() // Budget
                    ]
                ),
                z.tuple(
                    [
                        z.string(), // Id
                        z.number(), // Modified
                        z.number(), // Date
                        z.number(), // Value
                        z.string(), // Currency
                        z.string(), // Account
                        z.number(), // Account Value
                        z.string(), // Budget
                        z.union([z.number(), z.literal('')]) // Budget Value
                    ]
                ),
                z.tuple(
                    [
                        z.string(), // Id
                        z.number(), // Modified
                        z.number(), // Date
                        z.number(), // Value
                        z.string(), // Currency
                        z.string(), // Account
                        z.number(), // Account Value
                        z.string(), // Budget
                        z.union([z.number(), z.literal('')]), // Budget Value
                        z.string() // Tags
                    ]
                ),
                z.tuple(
                    [
                        z.string(), // Id
                        z.number(), // Modified
                        z.number(), // Date
                        z.number(), // Value
                        z.string(), // Currency
                        z.string(), // Account
                        z.number(), // Account Value
                        z.string(), // Budget
                        z.union([z.number(), z.literal('')]), // Budget Value
                        z.string(), // Tags
                        z.string() // Comment
                    ]
                )
            ]
        )
    )
})
