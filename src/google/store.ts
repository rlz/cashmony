import { isOk, type Google } from './google'
import makeUrl from './makeUrl'
import { type ExpensesGoal, type Account, type Category, type Operation } from '../model/model'
import { accsToGoogle, catsToGoogle, goalsToGoogle, opsToGoogle } from './googleDataSchema'
import { assertClearReplyBody, assertPutReplyBody } from '../typeCheckers.g/google'

export interface ClearReplyBody {
    clearedRange: string
    spreadsheetId: string
}

async function clearData (google: Google, tabName: string): Promise<void> {
    if (google.finDataSpreadsheetId === null) {
        throw Error(`finDataSpreadsheetId(${google.finDataSpreadsheetId ?? 'null'}) expected here`)
    }

    const id = encodeURIComponent(google.finDataSpreadsheetId)
    const range = `${tabName}!A2:J200000`

    const reply = await google.fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}:clear`,
        {
            method: 'POST'
        }
    )
    if (isOk(reply)) {
        const replyBody = assertClearReplyBody(reply.body)

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Cleared Google Spreadsheet ${replyBody.spreadsheetId}:${tabName} (range: ${replyBody.clearedRange})`)
    } else {
        console.warn('Unauthorized!')
    }
}

export interface PutReplyBody {
    spreadsheetId: string

    /**
     * @type uint
     */
    updatedCells: number

    /**
     * @type uint
     */
    updatedColumns: number

    updatedRange: string

    /**
     * @type uint
     */
    updatedRows: number
}

export async function storeRows (google: Google, tabName: string, range: string, rows: unknown[][]): Promise<void> {
    console.log(`Store ${rows.length} rows in ${google.spreadsheetName}:${tabName}`)

    if (google.finDataSpreadsheetId === null) {
        throw Error(`finDataSpreadsheetId(${google.finDataSpreadsheetId ?? 'null'}) expected here`)
    }

    const id = encodeURIComponent(google.finDataSpreadsheetId)
    range = `${tabName}!${range}`

    const reply = await google.fetch(
        makeUrl(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}`, {
            valueInputOption: 'RAW',
            includeValuesInResponse: 'false'
            // responseValueRenderOption: 'UNFORMATTED_VALUE'
        }),
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                range,
                majorDimension: 'ROWS',
                values: rows
            })
        }
    )
    if (isOk(reply)) {
        const replyBody = assertPutReplyBody(reply.body)

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Rows stored in ${replyBody.spreadsheetId} Spreadsheet (range: ${replyBody.updatedRange}, cells: ${replyBody.updatedCells})`)
    } else {
        console.warn('Unauthorized!')
    }
}

export async function storeOperations (google: Google, operations: readonly Operation[]): Promise<void> {
    console.log('Store operations')

    await clearData(google, google.tabNames.operations)
    await clearData(google, google.tabNames.operationsCategories)

    const rows = opsToGoogle(operations)

    await storeRows(google, google.tabNames.operations, 'A2:Z200000', rows.operations)
    await storeRows(google, google.tabNames.operationsCategories, 'A2:Z200000', rows.categories)

    console.log('End store operations')
}

export async function storeAccounts (google: Google, accounts: readonly Account[]): Promise<void> {
    console.log('Store accounts')

    await clearData(google, google.tabNames.accounts)

    const rows = accsToGoogle(accounts)

    await storeRows(google, google.tabNames.accounts, 'A2:Z200000', rows)

    console.log('End store accounts')
}

export async function storeCategories (google: Google, categories: readonly Category[]): Promise<void> {
    console.log('Store categories')

    await clearData(google, google.tabNames.categories)

    const rows = catsToGoogle(categories)

    await storeRows(google, google.tabNames.categories, 'A2:Z200000', rows)

    console.log('End store categories')
}

export async function storeGoals (google: Google, goals: readonly ExpensesGoal[]): Promise<void> {
    console.log('Store goals')

    await clearData(google, google.tabNames.goals)

    const rows = goalsToGoogle(goals)

    await storeRows(google, google.tabNames.goals, 'A2:Z200000', rows)

    console.log('End store goals')
}
