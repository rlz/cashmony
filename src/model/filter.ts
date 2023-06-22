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
