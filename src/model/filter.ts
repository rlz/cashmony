import { type NotDeletedOperation } from './model'

type FilterMode = 'all' | 'selected' | 'exclude'

export interface Filter {
    search: string | null

    opTypeMode: FilterMode
    opType: Array<NotDeletedOperation['type']>

    categoriesMode: FilterMode
    categories: readonly string[]

    accountsMode: FilterMode
    accounts: readonly string[]

    tagsMode: FilterMode
    tags: readonly string[]
}

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
