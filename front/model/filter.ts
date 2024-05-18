import { Filter } from '../../engine/model'

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
