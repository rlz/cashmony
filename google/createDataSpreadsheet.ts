import { runInAction } from 'mobx'

import { type Google, isOk } from './google'

export async function createDataSpreadsheet(google: Google): Promise<void> {
    const reply = await google.fetch(
        'https://sheets.googleapis.com/v4/spreadsheets',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    title: google.spreadsheetName
                },
                sheets: [...google.sheetsDefs.values()]
            })
        }
    )

    if (isOk(reply)) {
        const json = reply.body as { spreadsheetId: string }
        runInAction(() => {
            google.finDataSpreadsheetId = json.spreadsheetId
        })
    } else {
        console.warn('Unauthorized')
    }
}
