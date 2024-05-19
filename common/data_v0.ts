import { z } from 'zod'

const uuidSchema = z.string().uuid()

export const moneyValueSchemaV0 = z.object({
    currency: z.string(),
    amount: z.number()
})

export const apiLinkedAmountSchemaV0 = z.object({
    id: z.string(),
    amount: z.number()
}).readonly()

const apiBaseOperationSchemaV0 = z.object({
    id: uuidSchema,
    date: z.string().date(),
    value: moneyValueSchemaV0,
    account: apiLinkedAmountSchemaV0,
    tags: z.array(z.string()).readonly(),
    comment: z.string().nullable(),
    lastModified: z.string().datetime()
}).readonly()

export const apiIncomeOperationSchemaV0 = apiBaseOperationSchemaV0.and(z.object({
    type: z.literal('income'),
    categories: z.array(apiLinkedAmountSchemaV0).readonly()
})).readonly()

export const apiExpenseOperationSchemaV0 = apiBaseOperationSchemaV0.and(z.object({
    type: z.literal('expense'),
    categories: z.array(apiLinkedAmountSchemaV0).readonly()
})).readonly()

export const apiTransferOperationSchemaV0 = apiBaseOperationSchemaV0.and(z.object({
    type: z.literal('transfer'),
    toAccount: apiLinkedAmountSchemaV0
})).readonly()

export const apiAdjustmentOperationSchemaV0 = apiBaseOperationSchemaV0.and(z.object({
    type: z.literal('adjustment')
})).readonly()

export const apiDeletedOperationSchemaV0 = z.object({
    id: uuidSchema,
    type: z.literal('deleted'),
    lastModified: z.string().datetime()
}).readonly()

export const apiNotDeletedOperationSchemaV0 = apiIncomeOperationSchemaV0
    .or(apiExpenseOperationSchemaV0)
    .or(apiTransferOperationSchemaV0)
    .or(apiAdjustmentOperationSchemaV0)

export const apiOperationSchemaV0 = apiNotDeletedOperationSchemaV0.or(apiDeletedOperationSchemaV0)

export type ApiOperationV0 = z.infer<typeof apiOperationSchemaV0>

export const apiCategorySchemaV0 = z.object({
    id: uuidSchema,
    name: z.string(),
    perDayGoal: moneyValueSchemaV0.nullable(),
    deleted: z.boolean(),
    lastModified: z.string().datetime()
}).readonly()

export type ApiCategoryV0 = z.infer<typeof apiCategorySchemaV0>

export const apiAccountSchemaV0 = z.object({
    id: uuidSchema,
    name: z.string(),
    currency: z.string(),
    hidden: z.boolean(),
    deleted: z.boolean(),
    lastModified: z.string().datetime()
}).readonly()

export type ApiAccountV0 = z.infer<typeof apiAccountSchemaV0>

const apiFilterModeSchemaV0 = z.enum(['all', 'selected', 'exclude'])
const opTypesSchemaV0 = z.enum(['income', 'expense', 'transfer', 'adjustment'])

export const apiFilterSchemaV0 = z.object({
    search: z.string().nullable(),

    opTypeMode: apiFilterModeSchemaV0,
    opType: z.array(opTypesSchemaV0).readonly(),

    categoriesMode: apiFilterModeSchemaV0,
    categories: z.array(z.string()).readonly(),

    accountsMode: apiFilterModeSchemaV0,
    accounts: z.array(z.string()).readonly(),

    tagsMode: apiFilterModeSchemaV0,
    tags: z.array(z.string()).readonly()
}).readonly()

export const apiWatchSchemaV0 = apiCategorySchemaV0.and(z.object({
    perDayGoal: moneyValueSchemaV0,
    filter: apiFilterSchemaV0
})).readonly()

export type ApiWatchV0 = z.infer<typeof apiWatchSchemaV0>
