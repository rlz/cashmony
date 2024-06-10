import acme from 'acme-client'
import { FastifyBaseLogger } from 'fastify'
import { readFileSync, writeFileSync } from 'fs'
import { DateTime } from 'luxon'

type AddChallendgeFn = (token: string, content: string) => void
type RemoveChallendgeFn = (token: string) => void

const acmePkeyFilename = './auth/acmePkey.pem'
const acmeAccountUrlFilename = './auth/acmeAccountUrl'
const certPkeyFilename = './auth/certPkey.pem'
const certFilename = './auth/cert.pem'

async function readOrCreateAccountPkey(): Promise<Buffer> {
    try {
        return readFileSync(acmePkeyFilename)
    } catch {
        const pkey = await acme.crypto.createPrivateKey()
        writeFileSync(acmePkeyFilename, pkey.toString('ascii'))
        return pkey
    }
}

function readAccountUrl(): string | undefined {
    try {
        return readFileSync(acmeAccountUrlFilename, 'ascii')
    } catch {
    }
}

function getExpiry(cert: Buffer): DateTime {
    return DateTime.fromJSDate(acme.crypto.readCertificateInfo(cert).notAfter)
}

export class AcmeClient {
    private readonly logger?: FastifyBaseLogger
    private readonly c: acme.Client
    private expiry: DateTime = DateTime.now()

    private constructor(logger: FastifyBaseLogger | undefined, pkey: Buffer) {
        this.logger = logger

        this.c = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.production,
            accountUrl: readAccountUrl(),
            accountKey: pkey
        })
    }

    static async create(logger: FastifyBaseLogger | undefined): Promise<AcmeClient> {
        const pkey = await readOrCreateAccountPkey()

        return new AcmeClient(logger, pkey)
    }

    hasAccount(): boolean {
        try {
            this.c.getAccountUrl()
            return true
        } catch {
            return false
        }
    }

    async registerAccount(email: string) {
        const account = await this.c.createAccount({
            contact: [`mailto:${email}`],
            termsOfServiceAgreed: true
        })

        if (account.status !== 'valid') {
            throw Error('Can not register account')
        }

        const accountUrl = this.c.getAccountUrl()
        writeFileSync(acmeAccountUrlFilename, accountUrl, 'ascii')
    }

    async cert(domain: string, addChallendge: AddChallendgeFn, removeChallendge: RemoveChallendgeFn): Promise<{ key: Buffer, cert: Buffer }> {
        try {
            const key = readFileSync(certPkeyFilename)
            const cert = readFileSync(certFilename)

            this.expiry = getExpiry(cert)

            if (this.logger !== undefined) {
                this.logger.info({ expiry: this.expiry.toISO() }, 'Certificate is found')
            } else {
                console.log(`Certificate is found (expiry: ${this.expiry.toISO()})`)
            }

            if (!this.shouldRenewCert()) {
                return { key, cert }
            }
        } catch {
        }

        if (this.logger !== undefined) {
            this.logger.info('Certificate is not found or expired')
        } else {
            console.log('Certificate is not found or expired')
        }

        const i = await this.newCert(domain, addChallendge, removeChallendge)
        this.expiry = getExpiry(i.cert)

        if (this.logger !== undefined) {
            this.logger.info({ expiry: this.expiry.toISO() }, 'Got a new certificate')
        } else {
            console.log(`Got a new certificate: ${this.expiry.toISO()})`)
        }

        return i
    }

    private async newCert(domain: string, addChallendge: AddChallendgeFn, removeChallendge: RemoveChallendgeFn) {
        const [key, csr] = await acme.crypto.createCsr({
            commonName: domain
        })

        const cert = await this.c.auto({
            csr,
            challengePriority: ['http-01'],
            async challengeCreateFn(_, c, contents) {
                addChallendge(c.token, contents)
            },
            async challengeRemoveFn(_, c) {
                removeChallendge(c.token)
            }
        })

        writeFileSync(certPkeyFilename, key)
        writeFileSync(certFilename, cert, { encoding: 'ascii' })

        return { key, cert: Buffer.from(cert, 'ascii') }
    }

    shouldRenewCert(): boolean {
        const interval = this.expiry.diffNow()
        return interval.as('days') < 30
    }
}
