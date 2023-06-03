import { isOk, type Google } from './google'
import makeUrl from './makeUrl'
import { accsFromGoogle, catsFromGoogle, opsFromGoogle } from './googleDataSchema'
import { type Account, type Category, type Operation } from '../model/model'
import { assertRowsType } from '../typeCheckers.g/google'

export interface RowsType {
    values?: unknown[]
}

async function loadRows (google: Google, tabName: string): Promise<unknown[]> {
    console.log(`Loading ${google.sheetName}:${tabName}`)

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
        const rows = assertRowsType(reply.body).values ?? []

        console.log(`${rows.length} rows loaded`)

        return rows
    } else {
        console.warn('Unauthorized!')

        return []
    }
}

export async function loadOperations (google: Google): Promise<Operation[]> {
    console.log('Loading operations from Google Spreadsheet')
    const operations = await loadRows(google, google.tabNames.operations)
    const categories = await loadRows(google, google.tabNames.operationsCategories)

    const ops = opsFromGoogle({ operations, categories })

    console.log(`${ops.length} operations loaded`)

    return ops
}

export async function loadAccounts (google: Google): Promise<Account[]> {
    console.log('Loading accounts from Google Spreadsheet')
    const rows = await loadRows(google, google.tabNames.accounts)

    const accounts = accsFromGoogle(rows)

    console.log(`${accounts.length} accounts loaded`)

    return accounts
}

export async function loadCategories (google: Google): Promise<Category[]> {
    console.log('Loading categories from Google Spreadsheet')
    const rows = await loadRows(google, google.tabNames.categories)

    const categories = catsFromGoogle(rows)

    console.log(`${categories.length} categories loaded`)

    return categories
}