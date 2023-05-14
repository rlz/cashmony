import { isOk, type Google } from './google'
import makeUrl from './makeUrl'
import { opsFromGoogle } from './googleDataSchema'
import { z } from 'zod'
import { type Operation } from '../model/model'

export async function loadOperations (google: Google): Promise<Operation[]> {
    console.log('Loading transactions')
    if (google.finDataSpreadsheetId === null) {
        throw Error(`finDataSpreadsheetId(${google.finDataSpreadsheetId ?? 'null'}) expected here`)
    }

    const id = encodeURIComponent(google.finDataSpreadsheetId)
    const range = encodeURIComponent('Operations!A2:J200000')
    const reply = await google.fetch(
        makeUrl(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}`, {
            valueRenderOption: 'UNFORMATTED_VALUE'
        })
    )
    if (isOk(reply)) {
        const rows = z.object({
            values: z.array(z.unknown())
        }).parse(reply.body).values

        const ops = opsFromGoogle(rows)

        console.log(`${ops.length} transactions loaded`)

        return ops
    } else {
        console.warn('Unauthorized!')

        return []
    }
}
