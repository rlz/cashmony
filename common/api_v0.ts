import { z, ZodType } from 'zod'

export const apiAuthResponseSchemaV0 = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    tempPassword: z.string()
})

export type ApiAuthResponseV0 = z.infer<typeof apiAuthResponseSchemaV0>

export const apiSignupRequestSchemaV0 = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string()
})

export type ApiSignupRequestV0 = z.infer<typeof apiSignupRequestSchemaV0>

export const apiSigninRequestSchemaV0 = z.object({
    name: z.string(),
    password: z.string()
})

export type ApiSigninRequestV0 = z.infer<typeof apiSigninRequestSchemaV0>

export function apiItemsResponseSchemaV0<T extends ZodType>(itemsSchema: T) {
    return z.object({
        items: z.array(itemsSchema).readonly()
    }).readonly()
}

export type ApiItemsResponseV0<T extends ZodType> = z.infer<ReturnType<typeof apiItemsResponseSchemaV0<T>>>

export const apiGetObjectsRequestSchemaV0 = z.object({
    ids: z.array(z.string().uuid()).min(1).readonly()
}).readonly()

export type ApiGetObjectsRequestV0 = z.infer<typeof apiGetObjectsRequestSchemaV0>

export const apiComparisonObjectSchemaV0 = z.object({
    id: z.string().uuid(),
    lastModified: z.string().datetime()
})

export type ApiComparisonObjectV0 = z.infer<typeof apiComparisonObjectSchemaV0>

export function apiItemsRequestSchemaV0<T extends ZodType>(itemsSchema: T) {
    return z.object({
        items: z.array(itemsSchema).min(1).readonly()
    }).readonly()
}

export type ApiItemsRequestV0<T extends ZodType> = z.infer<ReturnType<typeof apiItemsRequestSchemaV0<T>>>
