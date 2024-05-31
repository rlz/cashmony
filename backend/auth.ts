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

async function signup(mongo: MongoStorage, name: string, email: string, password: string): Promise<ApiAuthResponseV0> {
    const salt = randomBytes(64)
    const hash = calcHash(password, salt)
    const id = uuidv7()
    try {
        await mongo.createUser(id, name, email, new Binary(salt), new Binary(hash))
    } catch (e) {
        if (e instanceof MongoServerError && e.code === 11000) {
            // duplicate key error
            throw httpErrors.conflict()
        }
        throw e
    }
    const tempPassword = await makeTempPassword(mongo, id)
    return {
        id,
        name,
        email,
        tempPassword
    }
}

async function signin(mongo: MongoStorage, name: string, password: string): Promise<ApiAuthResponseV0 | null> {
    const u = await mongo.getUser(name)
    if (u === null) {
        return null
    }

    const hash = calcHash(password, u.passwordSalt.value())

    if (!hash.equals(u.passwordHash.value())) {
        return null
    }

    const tempPassword = await makeTempPassword(mongo, u._id)

    await mongo.markUserActive(u._id)

    return {
        id: u._id,
        name: u.name,
        email: u.email,
        tempPassword
    }
}

async function logout(mongo: MongoStorage, userId: string, tempPassword: string) {
    const hash = calcHash(tempPassword, TEMP_PASSWORD_SALT)
    await mongo.deleteTempPassword(userId, new Binary(hash))
}

async function verifyTempPassword(mongo: MongoStorage, userId: string, tempPassword: string): Promise<string> {
    const hash = calcTempPasswordHash(Buffer.from(tempPassword, 'base64'))
    const u = await mongo.getUserByTempPassword(userId, new Binary(hash))
    if (u === null) {
        throw httpErrors.forbidden()
    }

    await mongo.markUserActive(u._id)

    return u._id
}

async function makeTempPassword(mongo: MongoStorage, userId: string): Promise<string> {
    const password = randomBytes(128)
    const passwordHash = calcTempPasswordHash(password)
    await mongo.pushTempPassword(userId, new Binary(passwordHash), DateTime.utc().plus({ days: 7 }).toJSDate())
    return password.toString('base64')
}

export function registerAuthEndpoints(app: FastifyInstance, mongo: MongoStorage) {
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
            return await signup(mongo, body.name, body.email, body.password)
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
            const r = await signin(mongo, body.name, body.password)
            if (r === null) {
                return httpErrors.unauthorized()
            }
            return r
        }
    )

    app.post(
        '/api/v0/logout',
        {
        },
        async (req, _resp) => {
            const authHeader = req.headers.authorization

            if (authHeader === undefined) {
                throw httpErrors.forbidden()
            }

            const [userId, tempPassword] = authHeader.split(':')

            await logout(mongo, userId, tempPassword)
        }
    )
}

export async function auth(req: FastifyRequest, mongo: MongoStorage): Promise<string> {
    const authHeader = req.headers.authorization
    if (authHeader === undefined) {
        throw httpErrors.forbidden()
    }
    const [userId, tempPassword] = authHeader.split(':')

    return await verifyTempPassword(mongo, userId, tempPassword)
}

function calcHash(password: string, salt: Uint8Array): Buffer {
    return scryptSync(password, salt, 512, { N: 1024 })
}

function calcTempPasswordHash(tempPassword: Uint8Array): Buffer {
    return scryptSync(tempPassword, TEMP_PASSWORD_SALT, 512, { N: 1024 })
}
