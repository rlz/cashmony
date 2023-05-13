import { runInAction } from 'mobx'
import { isOk, type Google } from './google'

export async function createDataSpreadsheet (google: Google): Promise<void> {
    const reply = await google.fetch(
        'https://sheets.googleapis.com/v4/spreadsheets',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    title: '.FinData'
                },
                sheets: [
                    {
                        properties: {
                            title: 'Operations'
                        },
                        data: [
                            {
                                startRow: 0,
                                startColumn: 0,
                                rowData: [
                                    {
                                        values: [
                                            'opId', 'opType', 'lastModified', 'date',
                                            'amount', 'currency',
                                            'accOrCat', 'accOrCatAmount',
                                            'tags', 'comment'
                                        ].map(i => {
                                            return {
                                                userEnteredValue: {
                                                    stringValue: i
                                                }
                                            }
                                        })
                                    }
                                ]
                            }
                        ]
                    }
                ]
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
