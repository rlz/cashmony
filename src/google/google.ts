import './google.scss'
import makeUrl from './makeUrl'
import { createDataSpreadsheet } from './createDataSpreadsheet'

const ACCESS_TOKEN = 'access_token'
const GOOGLE_CLIENT_ID = '969343913019-635prket9b5rq0skn212ab098u5m22pv.apps.googleusercontent.com'
const OK = 200
const UNAUTHENTICATED = 401

let google: Google | null = null

export class Google {
    accessToken = localStorage.getItem(ACCESS_TOKEN)
    finDataSpreadsheetId: string | null = null

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
                    // 'https://www.googleapis.com/auth/drive.readonly',
                    'https://www.googleapis.com/auth/drive.file',
                    'https://www.googleapis.com/auth/spreadsheets'
                ].join(' ')
            }
        )

        await new Promise<void>((resolve, reject) => {
            const iframe = document.createElement('iframe')
            iframe.id = 'GoogleAuth'
            iframe.src = url
            iframe.onload = (ev) => {
                const redirectUrl = iframe.contentWindow?.location.href
                iframe.remove()
                if (redirectUrl === undefined) {
                    throw Error('Undefined redirect URL')
                }

                const params: Record<string, string> = {}
                redirectUrl.substring(redirectUrl.indexOf('#') + 1).split('&').forEach(i => {
                    const [param, value] = i.split('=')
                    params[param] = decodeURIComponent(value)
                })
                if ('access_token' in params && 'expires_in' in params && 'scope' in params && 'token_type' in params) {
                    this.accessToken = params.access_token
                    localStorage.setItem(ACCESS_TOKEN, params.access_token)
                    console.log('Authenticated')
                    resolve()
                } else {
                    reject(Error(`Can not parse auth URL: ${redirectUrl}`))
                }
            }
            document.body.appendChild(iframe)
        })
    }

    async searchOrCreateDataSpreadsheet (): Promise<void> {
        console.log('Searching for data spreadsheet')

        const reply = await this.fetch(
            makeUrl('https://www.googleapis.com/drive/v3/files', {
                corpora: 'user',
                includeItemsFromAllDrives: 'false',
                q: 'mimeType = "application/vnd.google-apps.spreadsheet" and name = ".FinData"'
            })
        )
        if (isOk(reply)) {
            const json = reply.body as { files: GoogleDriveFiles[] }
            const files = json.files.filter(f => f.name === '.FinData')

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
