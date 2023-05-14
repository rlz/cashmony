import { isOk, type Google } from './google'
import makeUrl from './makeUrl'
import { type Operation } from '../model/model'
import { opsToGoogle } from './googleDataSchema'
import { z } from 'zod'

const CLEAR_REPLY_BODY_SCHEMA = z.object({
    clearedRange: z.string(),
    spreadsheetId: z.string()
})

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
        const replyBody = CLEAR_REPLY_BODY_SCHEMA.parse(reply.body)

        console.log(`Cleared Google Spreadsheet ${replyBody.spreadsheetId} (range: ${replyBody.clearedRange})`)
    } else {
        console.warn('Unauthorized!')
    }
}

const PUT_REPLY_BODY_SCHEMA = z.object({
    spreadsheetId: z.string(),
    updatedCells: z.number().int(),
    updatedColumns: z.number().int(),
    updatedRange: z.string(),
    updatedRows: z.number().int()
})

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
        const replyBody = PUT_REPLY_BODY_SCHEMA.parse(reply.body)

        console.log(`Store values in ${replyBody.spreadsheetId} Spreadsheet (range: ${replyBody.updatedRange}, cells: ${replyBody.updatedCells})`)
    } else {
        console.warn('Unauthorized!')
    }
}
