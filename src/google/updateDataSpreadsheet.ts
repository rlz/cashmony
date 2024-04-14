import { z } from 'zod'

import { nonNull } from '../helpers/smallTools'
import { type Google, type GoogleSheetProperties, isOk } from './google'
import { storeRows } from './store'

const getSpreadsheetReplySchema = z.object({
    sheets: z.array(z.object({
        properties: z.object({
            title: z.string()
        })
    }))
})

export async function updateDataSpreadsheet(google: Google): Promise<void> {
    const finDataSpreadsheetId = nonNull(google.finDataSpreadsheetId, 'google.finDataSpreadsheetId expected here')

    const reply = await google.fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(finDataSpreadsheetId)}`
    )

    if (isOk(reply)) {
        const sheets = getSpreadsheetReplySchema.parse(reply.body).sheets
        const sheetsDefs = new Map(google.sheetsDefs)

        sheets.forEach(s => sheetsDefs.delete(s.properties.title))

        if (sheetsDefs.size > 0) {
            console.log(`Needs to create sheets: ${[...sheetsDefs.keys()].join(', ')}`)

            const defs = [...sheetsDefs.values()]
            await Promise.all(defs.map(async (def) => {
                await addSheets(google, def)
                await addFirstRow(google, def)
            }))
        }
    } else {
        console.warn('Unauthorized')
    }
}

async function addSheets(google: Google, def: GoogleSheetProperties): Promise<void> {
    const finDataSpreadsheetId = nonNull(google.finDataSpreadsheetId, 'google.finDataSpreadsheetId expected here')

    const id = encodeURIComponent(finDataSpreadsheetId)

    const reply = await google.fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [
                    {
                        addSheet: {
                            properties: def.properties
                        }
                    }
                ]
            })
        }
    )
    if (isOk(reply)) {
        console.log(`New sheet added: ${def.properties.title}`)
    } else {
        console.warn('Unauthorized!')
    }
}

async function addFirstRow(google: Google, def: GoogleSheetProperties): Promise<void> {
    await storeRows(google, google.tabNames.goals, 'A1:Z1', [def.data[0].rowData[0].values.map(i => i.userEnteredValue.stringValue)])
}
