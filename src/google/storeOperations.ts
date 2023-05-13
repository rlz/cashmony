import { isOk, type Google } from './google'
import makeUrl from './makeUrl'
import { type Operation } from '../model/operations'
import { opsToGoogle } from './googleDataSchema'

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
        const values = reply.body

        console.log('Reply from Google clear data')

        console.log(values)
    } else {
        console.warn('Unauthorized!')
    }
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

    console.log(values)

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
        const values = reply.body

        console.log('Reply from Google PUT')

        console.log(values)
    } else {
        console.warn('Unauthorized!')
    }
}
