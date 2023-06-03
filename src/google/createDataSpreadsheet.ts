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
                    title: google.sheetName
                },
                sheets: [
                    makeSheet(google.tabNames.operations, [
                        'opId', 'opType', 'lastModified', 'date',
                        'amount', 'currency',
                        'acc', 'accAmount',
                        'tags', 'comment'
                    ]),
                    makeSheet(google.tabNames.operationsCategories, ['opId', 'cat', 'catAmount']),
                    makeSheet(google.tabNames.accounts, ['name', 'currency', 'lastModified', 'hidden', 'deleted']),
                    makeSheet(google.tabNames.categories, ['name', 'currency', 'lastModified', 'yearGoal', 'hidden', 'deleted'])
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

function makeSheet (tabName: string, columns: string[]): unknown {
    return {
        properties: {
            title: tabName
        },
        data: [
            {
                startRow: 0,
                startColumn: 0,
                rowData: [
                    {
                        values: columns.map(i => {
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
}
