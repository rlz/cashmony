import { z } from 'zod'

const moneyValueStorageSchema = z.object({
    value: z.number(),
    currency: z.string()
}).readonly()

const accountOrCategoryRefStorageSchema = z.object({
    id: z.string(),
    amount: z.number()
}).readonly()

const baseOperationStorageSchema = z.object({
    ver: z.literal(1),
    id: z.string(),
    lastModified: z.string().datetime({ offset: true }),
    date: z.string().datetime({ offset: true }),
    amount: moneyValueStorageSchema,
    tags: z.array(z.string().min(1)).readonly(),
    comment: z.string().nullable(),
    account: accountOrCategoryRefStorageSchema
}).readonly()

export const incomeOperationStorageSchema = baseOperationStorageSchema.and(
    z.object({
        type: z.literal('income'),
        categories: z.array(accountOrCategoryRefStorageSchema).readonly()
    }).readonly()
).readonly()

export const expenseOperationStorageSchema = baseOperationStorageSchema.and(
    z.object({
        type: z.literal('expense'),
        categories: z.array(accountOrCategoryRefStorageSchema).readonly()
    }).readonly()
).readonly()

export const transferOperationStorageSchema = baseOperationStorageSchema.and(
    z.object({
        type: z.literal('transfer'),
        toAccount: accountOrCategoryRefStorageSchema
    }).readonly()
).readonly()

export const adjustmentOperationStorageSchema = baseOperationStorageSchema.and(
    z.object({
        type: z.literal('adjustment'),
        toAccount: accountOrCategoryRefStorageSchema
    }).readonly()
).readonly()

export const deletedOperationStorageSchema = z.object({
    id: z.string(),
    type: z.literal('deleted')
}).readonly()

export const notDeletedOperationStorageSchema = incomeOperationStorageSchema
    .or(expenseOperationStorageSchema)
    .or(transferOperationStorageSchema)
    .or(adjustmentOperationStorageSchema)

export const operationStorageSchema = notDeletedOperationStorageSchema.or(deletedOperationStorageSchema)

export type IncomeOperationStorageSchema = z.infer<typeof incomeOperationStorageSchema>
export type ExpenseOperationStorageSchema = z.infer<typeof expenseOperationStorageSchema>
export type TransferOperationStorageSchema = z.infer<typeof transferOperationStorageSchema>
export type AdjustmentOperationStorageSchema = z.infer<typeof adjustmentOperationStorageSchema>
export type DeletedOperationStorageSchema = z.infer<typeof deletedOperationStorageSchema>

export type NotDeletedOperation = z.infer<typeof notDeletedOperationStorageSchema>
export type OperationStorageSchema = z.infer<typeof operationStorageSchema>
