import { DateTime } from 'luxon'
import { uuidv7 } from 'uuidv7'

import { toValid } from '../../common/dates'
import { Account, AdjustmentOperation, Category, ExpenseOperation, IncomeOperation, Operation, TransferOperation } from '../model'

interface TestData {
    readonly accounts: readonly Account[]
    readonly categories: readonly Category[]
    readonly operations: readonly Operation[]
}

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomAmount(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2))
}

function getRandomDate(start: DateTime<true>, end: DateTime<true>): DateTime<true> {
    return start.plus(Math.random() * (end.toMillis() - start.toMillis())).startOf('day')
}

const categoryDetails: { [key: string]: { comments: string[], tags: string[] } } = {
    'Rent/Mortgage': {
        comments: ['Monthly rent', 'Mortgage payment'],
        tags: ['monthly', 'housing']
    },
    'Utilities': {
        comments: ['Electricity bill', 'Water bill', 'Gas bill'],
        tags: ['monthly', 'bills']
    },
    'Telecom': {
        comments: ['Phone bill', 'Internet bill'],
        tags: ['monthly', 'communication']
    },
    'Groceries': {
        comments: ['Weekly groceries', 'Supermarket shopping'],
        tags: ['weekly', 'food']
    },
    'Dining Out': {
        comments: ['Dinner with friends', 'Lunch at restaurant'],
        tags: ['leisure', 'food']
    },
    'Transportation': {
        comments: ['Gas refill', 'Public transport'],
        tags: ['commuting', 'travel']
    },
    'Health': {
        comments: ['Doctor visit', 'Pharmacy purchase'],
        tags: ['medical', 'healthcare']
    },
    'Entertainment': {
        comments: ['Movie night', 'Concert ticket'],
        tags: ['leisure', 'fun']
    },
    'Clothing': {
        comments: ['New clothes', 'Shoe purchase'],
        tags: ['shopping', 'apparel']
    },
    'Personal Care': {
        comments: ['Haircut', 'Spa day'],
        tags: ['self-care', 'beauty']
    },
    'Travel/Vacation': {
        comments: ['Flight tickets', 'Hotel booking'],
        tags: ['holiday', 'travel']
    },
    'Gifts': {
        comments: ['Birthday gift', 'Wedding gift'],
        tags: ['present', 'celebration']
    },
    'Home Maintenance': {
        comments: ['Plumbing repair', 'Electrical work'],
        tags: ['repair', 'maintenance']
    },
    'Education': {
        comments: ['Online course', 'Workshop fee'],
        tags: ['learning', 'development']
    },
    'Investment': {
        comments: ['Stock purchase', 'Mutual fund'],
        tags: ['finance', 'growth']
    },
    'Charity': {
        comments: ['Donation to charity', 'Fundraising event'],
        tags: ['giving', 'community']
    },
    'Other': {
        comments: ['Miscellaneous expense', 'Unexpected cost'],
        tags: ['other', 'misc']
    }
}

function generateMonthlyExpenses(from: DateTime<true>, to: DateTime<true>, category: Category, accounts: Account[], amountRange: [number, number], fixedDay?: number): ExpenseOperation[] {
    const expenses: ExpenseOperation[] = []

    for (let current = toValid(DateTime.utc(from.year, from.month, 1)); current <= to; current = current.plus({ month: 1 })) {
        const date = toValid(
            fixedDay
                ? DateTime.utc(current.year, current.month, fixedDay)
                : getRandomDate(current, current.endOf('month'))
        )

        if (date >= from && date <= to) {
            const amount = -getRandomAmount(amountRange[0], amountRange[1])
            const comment = getRandomElement(categoryDetails[category.name].comments)
            const tags = Array.from({ length: Math.floor(Math.random() * 3) }, () => getRandomElement(categoryDetails[category.name].tags))
            const account = getRandomElement(accounts)
            const currency = Math.random() < 0.2 ? getRandomElement(['USD', 'EUR', 'CNY']) : account.currency

            expenses.push({
                id: uuidv7(),
                lastModified: DateTime.utc(),
                date,
                currency,
                amount,
                tags,
                comment,
                account: { id: account.id, amount: amount * getRate(date, currency, account.currency) },
                type: 'expense',
                categories: [{
                    id: category.id,
                    amount
                }]
            })
        }
    }

    return expenses
}

function generateWeeklyExpenses(from: DateTime<true>, to: DateTime<true>, category: Category, accounts: Account[], amountRange: [number, number]): ExpenseOperation[] {
    const expenses: ExpenseOperation[] = []

    for (let current = from.startOf('week'); current <= to; current = current.plus({ week: 1 })) {
        const date = getRandomDate(current, current.endOf('week'))
        if (date >= from && date <= to) {
            const amount = -getRandomAmount(amountRange[0], amountRange[1])
            const comment = getRandomElement(categoryDetails[category.name].comments)
            const account = getRandomElement(accounts)
            const currency = Math.random() < 0.2 ? getRandomElement(['USD', 'EUR', 'CNY']) : account.currency
            const tags = Array.from({ length: Math.floor(Math.random() * 3) }, () => getRandomElement(categoryDetails[category.name].tags))
            expenses.push({
                id: uuidv7(),
                lastModified: DateTime.utc(),
                date,
                currency,
                amount,
                tags,
                comment,
                account: { id: account.id, amount: amount * getRate(date, currency, account.currency) },
                type: 'expense',
                categories: [{
                    id: category.id,
                    amount
                }]
            })
        }
    }

    return expenses
}

function generateRandomExpenses(from: DateTime<true>, to: DateTime<true>, category: Category, accounts: Account[], amountRange: [number, number], frequencyPerMonth: number): ExpenseOperation[] {
    const expenses: ExpenseOperation[] = []
    const totalDays = to.diff(from).as('days')
    const numberOfExpenses = Math.floor(totalDays / 30 * frequencyPerMonth)

    for (let i = 0; i < numberOfExpenses; i++) {
        const date = getRandomDate(from, to)
        const amount = -getRandomAmount(amountRange[0], amountRange[1])
        const comment = getRandomElement(categoryDetails[category.name].comments)
        const account = getRandomElement(accounts)
        const currency = Math.random() < 0.2 ? getRandomElement(['USD', 'EUR', 'CNY']) : account.currency
        const tags = Array.from({ length: Math.floor(Math.random() * 3) }, () => getRandomElement(categoryDetails[category.name].tags))
        expenses.push({
            id: uuidv7(),
            lastModified: DateTime.utc(),
            date,
            currency,
            amount,
            tags,
            comment,
            account: { id: account.id, amount: amount * getRate(date, currency, account.currency) },
            type: 'expense',
            categories: [{
                id: category.id,
                amount
            }]
        })
    }

    return expenses
}

function generateIncomeOperation(date: DateTime, account: Account, amountRange: [number, number]): IncomeOperation {
    const amount = getRandomAmount(amountRange[0], amountRange[1])
    const currency = Math.random() < 0.2 ? getRandomElement(['USD', 'EUR', 'CNY']) : account.currency
    return {
        id: uuidv7(),
        lastModified: DateTime.utc(),
        date,
        currency,
        amount,
        tags: ['income'],
        comment: 'Salary',
        account: { id: account.id, amount },
        type: 'income',
        categories: []
    }
}

function generateTransferOperation(date: DateTime<true>, fromAccount: Account, toAccount: Account, amountRange: [number, number]): TransferOperation {
    const amount = getRandomAmount(amountRange[0], amountRange[1])
    return {
        id: uuidv7(),
        lastModified: DateTime.utc(),
        date,
        currency: fromAccount.currency,
        amount,
        tags: ['transfer'],
        comment: 'Transfer between accounts',
        account: { id: fromAccount.id, amount: -amount },
        type: 'transfer',
        toAccount: { id: toAccount.id, amount: amount * getRate(date, fromAccount.currency, toAccount.currency) }
    }
}

function generateAdjustmentOperation(date: DateTime, account: Account, amountRange: [number, number]): AdjustmentOperation {
    const amount = getRandomAmount(amountRange[0], amountRange[1])
    return {
        id: uuidv7(),
        lastModified: DateTime.utc(),
        date,
        currency: account.currency,
        amount,
        tags: ['adjustment'],
        comment: 'Balance adjustment',
        account: { id: account.id, amount },
        type: 'adjustment'
    }
}

const baseRates: Record<string, number> = {
    USD: 1,
    EUR: 0.94,
    CNY: 7.26,
    RUB: 90
}

const defaultRate = 10.0

function hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0 // Convert to 32bit integer
    }
    return hash
}

function getRate(date: DateTime<true>, from: string, to: string): number {
    if (from === to) return 1

    const dateStr = date.toISO().split('T')[0] // Convert date to YYYY-MM-DD format

    const baseRateFrom = baseRates[from] ?? defaultRate
    const baseRateTo = baseRates[to] ?? defaultRate

    const rate = baseRateTo / baseRateFrom
    const hash = hashCode(`${dateStr}-${from}-${to}`)
    const variance = ((hash % 200) - 100) / 10000 // Generates a small variance between -0.01 and 0.01

    return parseFloat((rate + variance).toFixed(4))
}

export function genTestData(from: DateTime<true>, to: DateTime<true>): TestData {
    const lastModified = DateTime.utc()

    const accounts: Record<string, Account> = Object.fromEntries(
        [
            'Yellow Bank USD',
            'Cash USD',
            'Green Bank USD',
            'Yellow Bank EUR',
            'Blue Bank CNY'
        ].map((name) => {
            return [
                name,
                {
                    id: uuidv7(),
                    name,
                    currency: name.slice(-3),
                    hidden: false,
                    lastModified
                }
            ]
        })
    )

    const categories: Record<string, Category> = Object.fromEntries(
        [
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
            return [
                name,
                {
                    id: uuidv7(),
                    name,
                    lastModified
                }
            ]
        })
    )

    const accountsList = Object.values(accounts)

    const operations: Operation[] = []

    operations.push(...generateMonthlyExpenses(from, to, categories['Rent/Mortgage'], accountsList, [800, 1500], 1))
    operations.push(...generateMonthlyExpenses(from, to, categories['Utilities'], accountsList, [50, 200]))
    operations.push(...generateMonthlyExpenses(from, to, categories['Telecom'], accountsList, [30, 100]))
    operations.push(...generateWeeklyExpenses(from, to, categories['Groceries'], accountsList, [50, 150]))
    operations.push(...generateRandomExpenses(from, to, categories['Dining Out'], accountsList, [15, 100], 4))
    operations.push(...generateRandomExpenses(from, to, categories['Transportation'], accountsList, [20, 100], 8))
    operations.push(...generateRandomExpenses(from, to, categories['Health'], accountsList, [50, 300], 2))
    operations.push(...generateRandomExpenses(from, to, categories['Entertainment'], accountsList, [20, 150], 4))
    operations.push(...generateRandomExpenses(from, to, categories['Clothing'], accountsList, [30, 200], 2))
    operations.push(...generateRandomExpenses(from, to, categories['Personal Care'], accountsList, [20, 100], 2))
    operations.push(...generateRandomExpenses(from, to, categories['Travel/Vacation'], accountsList, [200, 2000], 0.5))
    operations.push(...generateRandomExpenses(from, to, categories['Gifts'], accountsList, [20, 100], 1))
    operations.push(...generateRandomExpenses(from, to, categories['Home Maintenance'], accountsList, [50, 500], 1))
    operations.push(...generateRandomExpenses(from, to, categories['Education'], accountsList, [100, 1000], 0.5))
    operations.push(...generateRandomExpenses(from, to, categories['Investment'], accountsList, [100, 1000], 0.5))
    operations.push(...generateRandomExpenses(from, to, categories['Charity'], accountsList, [10, 100], 1))
    operations.push(...generateRandomExpenses(from, to, categories['Other'], accountsList, [10, 200], 2))

    for (let date = from; date < to; date = date.plus({ days: 1 })) {
        // Generate some incomes
        if (Math.random() < 0.1) {
            const account = getRandomElement(accountsList)
            operations.push(generateIncomeOperation(date, account, [1000, 5000]))
        }

        // Generate some transfers
        if (Math.random() < 0.05) {
            const fromAccount = getRandomElement(accountsList)
            let toAccount = getRandomElement(accountsList)
            while (toAccount.id === fromAccount.id) {
                toAccount = getRandomElement(accountsList)
            }
            operations.push(generateTransferOperation(date, fromAccount, toAccount, [100, 1000]))
        }

        // Generate some adjustments
        if (Math.random() < 0.05) {
            const account = getRandomElement(accountsList)
            operations.push(generateAdjustmentOperation(date, account, [-50, 50]))
        }
    }

    return {
        accounts: Object.values(accounts),
        categories: Object.values(categories),
        operations
    }
}
