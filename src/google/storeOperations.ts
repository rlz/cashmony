import { isOk, type Google } from './google'
import makeUrl from './makeUrl'
import { type Operation } from '../model/model'
import { opsToGoogle } from './googleDataSchema'
import { assertClearReplyBody, assertPutReplyBody } from '../typeCheckers.g/google'

export interface ClearReplyBody {
    clearedRange: string
    spreadsheetId: string
}

async function clearData (google: Google): Promise<void> {
    if (google.finDataSpreadsheetId === null) {
        throw Error(`finDataSpreadsheetId(${google.finDataSpreadsheetId ?? 'null'}) expected here`)
    }

    const id = encodeURIComponent(google.finDataSpreadsheetId)
    const range = 'Operations!A2:J200000'

    const reply = await google.fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(range)}:clear`,
        {
            method: 'POST'
        }
    )
    if (isOk(reply)) {
        const replyBody = assertClearReplyBody(reply.body)

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Cleared Google Spreadsheet ${replyBody.spreadsheetId} (range: ${replyBody.clearedRange})`)
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

export async function storeOperations (google: Google, operations: readonly Operation[]): Promise<void> {
    console.log('Store operation')
    if (google.finDataSpreadsheetId === null) {
        throw Error(`finDataSpreadsheetId(${google.finDataSpreadsheetId ?? 'null'}) expected here`)
    }

    await clearData(google)

    const id = encodeURIComponent(google.finDataSpreadsheetId)
    const range = 'Operations!A2:J200000'
    const values = opsToGoogle(operations)

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
                values
            })
        }
    )
    if (isOk(reply)) {
        const replyBody = assertPutReplyBody(reply.body)

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Store values in ${replyBody.spreadsheetId} Spreadsheet (range: ${replyBody.updatedRange}, cells: ${replyBody.updatedCells})`)
    } else {
        console.warn('Unauthorized!')
    }
}
