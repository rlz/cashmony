import { httpErrors } from '@fastify/sensible'
import { randomBytes, scryptSync } from 'crypto'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { DateTime } from 'luxon'
import { Binary, MongoServerError } from 'mongodb'
import { uuidv7 } from 'uuidv7'
import zodToJsonSchema from 'zod-to-json-schema'

import { apiAuthResponseSchemaV0, ApiAuthResponseV0, apiSigninRequestSchemaV0, apiSignupRequestSchemaV0 } from '../common/api_v0'
import { MongoStorage } from './storage/mongo'

const TEMP_PASSWORD_SALT = Buffer.from('cashmony-temp-password-salt', 'utf8')

let instance: Auth | null = null

export class Auth {
    private mongo = MongoStorage.instance()

    async signup(name: string, email: string, password: string): Promise<ApiAuthResponseV0> {
        const salt = randomBytes(64)
        const hash = calcHash(password, salt)
        const id = uuidv7()
        try {
            await this.mongo.createUser(id, name, email, new Binary(salt), new Binary(hash))
        } catch (e) {
            if (e instanceof MongoServerError && e.code === 11000) {
                // duplicate key error
                throw httpErrors.conflict()
            }
            throw e
        }
        const tempPassword = await this.makeTempPassword(id)
        return {
            id,
            name,
            email,
            tempPassword
        }
    }

    async signin(name: string, password: string): Promise<ApiAuthResponseV0 | null> {
        const u = await this.mongo.getUser(name)
        if (u === null) {
            return null
        }

        const hash = calcHash(password, u.passwordSalt.value())

        if (!hash.equals(u.passwordHash.value())) {
            return null
        }

        const tempPassword = await this.makeTempPassword(u._id)

        await this.mongo.markUserActive(u._id)

        return {
            id: u._id,
            name: u.name,
            email: u.email,
            tempPassword
        }
    }

    async logout(userId: string, tempPassword: string) {
        const hash = calcHash(tempPassword, TEMP_PASSWORD_SALT)
        await this.mongo.deleteTempPassword(userId, new Binary(hash))
    }

    async verifyTempPassword(userId: string, tempPassword: string): Promise<string> {
        const hash = calcTempPasswordHash(Buffer.from(tempPassword, 'base64'))
        const u = await this.mongo.getUserByTempPassword(userId, new Binary(hash))
        if (u === null) {
            throw httpErrors.forbidden()
        }

        await this.mongo.markUserActive(u._id)

        return u._id
    }

    static instance(): Auth {
        if (instance === null) {
            instance = new Auth()
        }

        return instance
    }

    private async makeTempPassword(userId: string): Promise<string> {
        const password = randomBytes(128)
        const passwordHash = calcTempPasswordHash(password)
        await this.mongo.pushTempPassword(userId, new Binary(passwordHash), DateTime.utc().plus({ days: 7 }).toJSDate())
        return password.toString('base64')
    }
}

export function registerAuthEndpoints(app: FastifyInstance) {
    app.post(
        '/api/v0/signup',
        {
            schema: {
                body: zodToJsonSchema(apiSignupRequestSchemaV0),
                response: { 200: zodToJsonSchema(apiAuthResponseSchemaV0) }
            }
        },
        async (req, _resp) => {
            const body = apiSignupRequestSchemaV0.parse(req.body)
            const auth = Auth.instance()
            return await auth.signup(body.name, body.email, body.password)
        }
    )

    app.post(
        '/api/v0/signin',
        {
            schema: {
                body: zodToJsonSchema(apiSigninRequestSchemaV0),
                response: { 200: zodToJsonSchema(apiAuthResponseSchemaV0) }
            }
        },
        async (req, _resp) => {
            const body = apiSigninRequestSchemaV0.parse(req.body)
            const r = await Auth.instance().signin(body.name, body.password)
            if (r === null) {
                return httpErrors.unauthorized()
            }
            return r
        }
    )
}

export async function auth(req: FastifyRequest): Promise<string> {
    const authHeader = req.headers.authorization
    if (authHeader === undefined) {
        throw httpErrors.forbidden()
    }
    const [userId, tempPassword] = authHeader.split(':')

    return await Auth.instance().verifyTempPassword(userId, tempPassword)
}

function calcHash(password: string, salt: Uint8Array): Buffer {
    return scryptSync(password, salt, 512, { N: 1024 })
}

function calcTempPasswordHash(tempPassword: Uint8Array): Buffer {
    return scryptSync(tempPassword, TEMP_PASSWORD_SALT, 512, { N: 1024 })
}
