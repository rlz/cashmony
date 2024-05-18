import { z } from 'zod'

import { Engine } from '../engine/engine'
import { Account, Category, Watch, Operation } from '../engine/model'
import { type Google, isOk } from './google'
import { accsFromGoogle, catsFromGoogle, goalsFromGoogle, opsFromGoogle } from './googleDataSchema'
import makeUrl from './makeUrl'

const RowsTypeSchema = z.object({
    values: z.array(z.unknown()).optional()
})

export type RowsType = z.infer<typeof RowsTypeSchema>

async function loadRows(google: Google, tabName: string): Promise<unknown[]> {
    console.log(`Loading ${google.spreadsheetName}:${tabName}`)

    if (google.finDataSpreadsheetId === null) {
        throw Error(`finDataSpreadsheetId(${google.finDataSpreadsheetId ?? 'null'}) expected here`)
    }

    const id = encodeURIComponent(google.finDataSpreadsheetId)
    const range = encodeURIComponent(`${tabName}!A2:J200000`)
    const reply = await google.fetch(
        makeUrl(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}`, {
            valueRenderOption: 'UNFORMATTED_VALUE'
        })
    )
    if (isOk(reply)) {
        console.log('Reply', reply)
        const rows = RowsTypeSchema.parse(reply.body).values ?? []

        console.log(`${rows.length} rows loaded`)

        return rows
    } else {
        console.warn('Unauthorized!')

        return []
    }
}

export async function loadOperations(google: Google, engine: Engine): Promise<Operation[]> {
    console.log('Loading operations from Google Spreadsheet')
    const operations = await loadRows(google, google.tabNames.operations)
    const categories = await loadRows(google, google.tabNames.operationsCategories)

    const ops = opsFromGoogle({ operations, categories }, engine)

    console.log(`${ops.length} operations loaded`)

    return ops
}

export async function loadAccounts(google: Google, engine: Engine): Promise<Account[]> {
    console.log('Loading accounts from Google Spreadsheet')
    const rows = await loadRows(google, google.tabNames.accounts)

    const accounts = accsFromGoogle(rows, engine)

    console.log(`${accounts.length} accounts loaded`)

    return accounts
}

export async function loadCategories(google: Google, engine: Engine): Promise<Category[]> {
    console.log('Loading categories from Google Spreadsheet')
    const rows = await loadRows(google, google.tabNames.categories)

    const categories = catsFromGoogle(rows, engine)

    console.log(`${categories.length} categories loaded`)

    return categories
}

export async function loadGoals(google: Google, engine: Engine): Promise<Watch[]> {
    console.log('Loading goals from Google Spreadsheet')
    const rows = await loadRows(google, google.tabNames.goals)

    const goals = goalsFromGoogle(rows, engine)

    console.log(`${goals.length} goals loaded`)

    return goals
}
