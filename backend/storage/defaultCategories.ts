import { DateTime } from 'luxon'
import { uuidv7 } from 'uuidv7'

import { ApiCategoryV0 } from '../../common/data_v0'

export function makeDefaultCategories(): ApiCategoryV0[] {
    const lastModified = DateTime.utc().toISO()

    return [
        'Rent/Mortgage',
        'Utilities',
        'Telecom',
        'Groceries',
        'Dining Out',
        'Transportation',
        'Health',
        'Entertainment',
        'Clothing',
        'Clothing',
        'Personal Care',
        'Travel/Vacation',
        'Gifts',
        'Home Maintenance',
        'Education',
        'Investment',
        'Charity',
        'Other'
    ].map((name) => {
        return {
            id: uuidv7(),
            name,
            perDayGoal: null,
            deleted: false,
            lastModified
        }
    })
}
