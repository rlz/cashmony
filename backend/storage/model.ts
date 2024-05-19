import { Binary } from 'mongodb'
import { z } from 'zod'

export const mongoObjectSchema = z.object({
    _id: z.string().uuid(),
    data: z.object({
        lastModified: z.string().datetime()
    })
})

export interface MongoObject<T> {
    _id: string
    ownerId: string
    syncDate: Date
    data: T
}

export interface MongoUser {
    _id: string
    name: string
    email: string
    passwordSalt: Binary
    passwordHash: Binary
    lastActivityDate: Date
}

export interface MongoTempPassword {
    userId: string
    passwordHash: Binary
    validUntil: Date
}
