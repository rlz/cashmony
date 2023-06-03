import './google.scss'
import makeUrl from './makeUrl'
import { createDataSpreadsheet } from './createDataSpreadsheet'
import { loadAccounts, loadCategories, loadOperations } from './load'
import { type Category, type Account, type Operation } from '../model/model'
import { storeAccounts, storeCategories, storeOperations } from './store'

const ACCESS_TOKEN = 'access_token'
const GOOGLE_CLIENT_ID = '969343913019-635prket9b5rq0skn212ab098u5m22pv.apps.googleusercontent.com'
const OK = 200
const UNAUTHENTICATED = 401

let google: Google | null = null

export class Google {
    private authPromiseResolve: (() => void) | null = null
    private accessToken = localStorage.getItem(ACCESS_TOKEN)
    finDataSpreadsheetId: string | null = null
    readonly sheetName = 'CashmonyData'
    readonly tabNames = {
        operations: 'Operations',
        operationsCategories: 'Operations — Categories',
        accounts: 'Accounts',
        categories: 'Categories'
    }

    static instance (): Google {
        if (google === null) {
            google = new Google()
        }

        return google
    }

    async fetch (input: RequestInfo | URL, init?: RequestInit): Promise<GoogleReply> {
        const accessToken = this.accessToken
        if (accessToken === null) {
            throw Error('Access token expected here')
        }

        if (init === undefined) {
            init = {}
        }
        const headers = new Headers(init.headers)
        headers.append('Authorization', 'Bearer ' + accessToken)
        init.headers = headers

        const reply = await fetch(input, init)

        if (reply.status === OK) {
            return {
                status: OK,
                body: await reply.json()
            }
        }

        if (reply.status === UNAUTHENTICATED) {
            localStorage.removeItem(ACCESS_TOKEN)
            this.accessToken = null
            return {
                status: UNAUTHENTICATED,
                body: await reply.json()
            }
        }

        throw Error(`Error call Google API: ${reply.status} ${reply.statusText}\n### Body ###\n${await reply.text()}\n### End of body ###`)
    }

    async authenticate (): Promise<void> {
        console.log('Authenticating')
        const url = makeUrl(
            'https://accounts.google.com/o/oauth2/v2/auth',
            {
                client_id: GOOGLE_CLIENT_ID,
                redirect_uri: 'http://localhost:3000/auth',
                response_type: 'token',
                scope: [
                    'https://www.googleapis.com/auth/drive.file',
                    'https://www.googleapis.com/auth/spreadsheets'
                ].join(' ')
            }
        )

        window.open(url, 'auth')

        await new Promise<void>((resolve) => {
            this.authPromiseResolve = resolve
        })
    }

    finishAuth (accessToken: string): void {
        this.accessToken = accessToken
        localStorage.setItem(ACCESS_TOKEN, accessToken)
        console.log('Authenticated')
        if (this.authPromiseResolve !== null) {
            this.authPromiseResolve()
            this.authPromiseResolve = null
        }
    }

    async searchOrCreateDataSpreadsheet (): Promise<void> {
        console.log('Searching for data spreadsheet')

        const reply = await this.fetch(
            makeUrl('https://www.googleapis.com/drive/v3/files', {
                corpora: 'user',
                includeItemsFromAllDrives: 'false',
                q: `mimeType = "application/vnd.google-apps.spreadsheet" and name = "${this.sheetName}"`
            })
        )
        if (isOk(reply)) {
            const json = reply.body as { files: GoogleDriveFiles[] }
            const files = json.files.filter(f => f.name === this.sheetName)

            if (files.length > 0) {
                this.finDataSpreadsheetId = files[0].id
                console.log(`Data spreadsheet found (${this.finDataSpreadsheetId})`)
            } else {
                await createDataSpreadsheet(this)
            }
        } else {
            console.warn('Unauthorised')
        }
    }

    loadOperations = async (): Promise<Operation[]> => await loadOperations(this)
    storeOperations = async (ops: readonly Operation[]): Promise<void> => { await storeOperations(this, ops) }
    loadAccounts = async (): Promise<Account[]> => await loadAccounts(this)
    storeAccounts = async (accounts: Account[]): Promise<void> => { await storeAccounts(this, accounts) }
    loadCategories = async (): Promise<Category[]> => await loadCategories(this)
    storeCategories = async (categories: Category[]): Promise<void> => { await storeCategories(this, categories) }
}

export interface GoogleReply {
    status: number
    body: unknown
}

export interface GoogleOkReply extends GoogleReply {
}

export interface GoogleUnauthenticatedReply extends GoogleReply {
}

export function isOk (reply: GoogleReply): reply is GoogleOkReply {
    return reply.status === OK
}

export function isUnauthenticated (reply: GoogleReply): reply is GoogleUnauthenticatedReply {
    return reply.status === UNAUTHENTICATED
}

interface GoogleDriveFiles {
    readonly kind: string
    readonly mimeType: string
    readonly id: string
    readonly name: string
}
