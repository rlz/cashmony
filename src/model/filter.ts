import { z } from 'zod'

const filterModeSchema = z.union([
    z.literal('all'),
    z.literal('selected'),
    z.literal('exclude')
])

export const filterSchema = z.object({
    search: z.nullable(z.string()),

    opTypeMode: filterModeSchema,
    opType: z.array(z.union([z.literal('expense'), z.literal('income'), z.literal('adjustment'), z.literal('transfer')])),

    categoriesMode: filterModeSchema,
    categories: z.array(z.string()),

    tagsMode: filterModeSchema,
    tags: z.array(z.string()),

    accountsMode: filterModeSchema,
    accounts: z.array(z.string())
})

export type Filter = z.infer<typeof filterSchema>

export const DEFAULT_FILTER: Filter = {
    search: null,
    opTypeMode: 'selected',
    opType: ['expense', 'income', 'transfer', 'adjustment'],
    categoriesMode: 'all',
    categories: [],
    accountsMode: 'all',
    accounts: [],
    tagsMode: 'all',
    tags: []
}
