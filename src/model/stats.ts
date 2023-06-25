import { type DurationLikeObject } from 'luxon'
import { CategoriesModel } from './categories'
import { type NotDeletedOperation, type Category, type Amount } from './model'
import { LastPeriodTimeSpan, type HumanTimeSpan, utcToday } from '../helpers/dates'
import { OperationsModel } from './operations'
import { AppState } from './appState'
import { CurrenciesModel } from './currencies'
import { P, match } from 'ts-pattern'
import { type Filter } from './filter'

const appState = AppState.instance()
const currenciesModel = CurrenciesModel.instance()
const categoriesModel = CategoriesModel.instance()
const operationsModel = OperationsModel.instance()

export class Operations {
    private readonly predicate: (op: NotDeletedOperation) => boolean

    private constructor (predicate: (op: NotDeletedOperation) => boolean) {
        this.predicate = predicate
    }

    static all (): Operations {
        return new Operations(() => true)
    }

    static forFilter (filter: Filter): Operations {
        let ops = Operations.all()

        if (filter.search !== null) {
            ops = ops.filterComment(filter.search)
        }

        if (filter.opTypeMode === 'selected') {
            ops = ops.keepTypes(...filter.opType)
        } else if (filter.opTypeMode === 'exclude') {
            ops = ops.excludeTypes(...filter.opType)
        }

        if (filter.accountsMode === 'selected') {
            ops = ops.keepAccounts(...filter.accounts)
        } else if (filter.accountsMode === 'exclude') {
            ops = ops.excludeAccounts(...filter.accounts)
        }

        if (filter.categoriesMode === 'selected') {
            if (filter.categories.find(c => c === '') === undefined) {
                ops = ops.skipUncategorized()
            }
            ops = ops.keepCategories(...filter.categories)
        } else if (filter.categoriesMode === 'exclude') {
            if (filter.categories.find(c => c === '') !== undefined) {
                ops = ops.skipUncategorized()
            }
            ops = ops.excludeCategories(...filter.categories)
        }

        if (filter.tagsMode === 'selected') {
            ops = ops.keepTags(...filter.tags)
        } else if (filter.tagsMode === 'exclude') {
            ops = ops.excludeTags(...filter.tags)
        }

        return ops
    }

    forTimeSpan (timeSpan?: HumanTimeSpan): Operations {
        if (timeSpan === undefined) {
            timeSpan = appState.timeSpan
        }

        const startDate = timeSpan.startDate
        const endDate = timeSpan.endDate

        return new Operations((op) => this.predicate(op) && op.date >= startDate && op.date <= endDate)
    }

    onlyUncategorized (): Operations {
        return new Operations(
            op => this.predicate(op) &&
            (op.type === 'expense' || op.type === 'income') &&
            op.categories.length === 0
        )
    }

    skipUncategorized (): Operations {
        return new Operations(
            op => this.predicate(op) &&
            (
                (op.type !== 'expense' && op.type !== 'income') ||
                op.categories.length > 0
            )
        )
    }

    filterComment (substring: string): Operations {
        return new Operations(
            op => this.predicate(op) &&
            op.comment?.includes(substring) === true
        )
    }

    onlyExpenses (): Operations {
        return new Operations(
            op => this.predicate(op) && (
                op.type === 'expense' ||
                (op.type === 'income' && op.categories.length > 0)
            )
        )
    }

    keepTypes (...types: Array<NotDeletedOperation['type']>): Operations {
        const typesSet = new Set<typeof types[number]>(types)
        return new Operations(
            op => this.predicate(op) && typesSet.has(op.type)
        )
    }

    excludeTypes (...types: Array<NotDeletedOperation['type']>): Operations {
        const typesSet = new Set<typeof types[number]>(types)
        return new Operations(
            op => this.predicate(op) && !typesSet.has(op.type)
        )
    }

    keepAccounts (...accounts: string[]): Operations {
        const accountsSet = new Set(accounts)
        return new Operations(
            op =>
                this.predicate(op) &&
                (
                    accountsSet.has(op.account.name) ||
                    (op.type === 'transfer' && accountsSet.has(op.toAccount.name))
                )
        )
    }

    excludeAccounts (...accounts: string[]): Operations {
        const accountsSet = new Set(accounts)
        return new Operations(
            op =>
                this.predicate(op) &&
                (
                    !accountsSet.has(op.account.name) &&
                    (op.type !== 'transfer' || !accountsSet.has(op.toAccount.name))
                )
        )
    }

    keepCategories (...categories: string[]): Operations {
        const categoriesSet = new Set(categories)
        return new Operations(
            op => this.predicate(op) &&
            (
                (op.type !== 'expense' && op.type !== 'income') ||
                op.categories.some(cat => categoriesSet.has(cat.name)) ||
                op.categories.length === 0
            )
        )
    }

    excludeCategories (...categories: string[]): Operations {
        const categoriesSet = new Set(categories)
        return new Operations(
            op => this.predicate(op) &&
            (
                (op.type !== 'expense' && op.type !== 'income') ||
                !op.categories.some(cat => categoriesSet.has(cat.name))
            )
        )
    }

    keepTags (...tags: string[]): Operations {
        const tagsSet = new Set(tags)
        return new Operations(op => this.predicate(op) && op.tags.some(t => tagsSet.has(t)))
    }

    excludeTags (...tags: string[]): Operations {
        const tagsSet = new Set(tags)
        return new Operations(op => this.predicate(op) && !op.tags.some(t => tagsSet.has(t)))
    }

    * operations (opts?: { reverse?: boolean }): Generator<NotDeletedOperation> {
        const ops = opts?.reverse === true
            ? [...operationsModel.operations].reverse()
            : operationsModel.operations

        for (const op of ops) {
            if (op.type === 'deleted') continue

            if (this.predicate(op)) {
                yield op
            }
        }
    }

    count (): number {
        let count = 0
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _ of this.operations()) {
            count += 1
        }
        return count
    }

    sumExpenses (toCurrency: string): number {
        let sum = 0
        for (const op of this.onlyExpenses().operations()) {
            if (op.type !== 'expense' && op.type !== 'income') {
                continue
            }

            if (op.categories.length === 0) {
                sum += op.amount * currenciesModel.getRate(op.date, op.currency, toCurrency)
                continue
            }

            for (const cat of op.categories) {
                sum += cat.amount * currenciesModel.getRate(op.date, op.currency, toCurrency)
            }
        }
        return sum
    }

    * groupByDate (opts?: { reverse?: boolean }): Generator<NotDeletedOperation[]> {
        let operations: NotDeletedOperation[] = []
        let currentMillis: number | null = null

        for (const op of this.operations({ reverse: opts?.reverse })) {
            const opMillis = op.date.toMillis()

            if (currentMillis === null) {
                currentMillis = opMillis
            }

            if (opMillis !== currentMillis) {
                yield operations
                operations = []
                currentMillis = opMillis
            }

            operations.push(op)
        }

        if (operations.length > 0) {
            yield operations
        }
    }
}

export class ExpensesStats {
    operations: Operations
    perDayGoal: Amount | null

    constructor (operations: Operations, perDayGoal: Amount | null) {
        this.operations = operations.onlyExpenses()
        this.perDayGoal = perDayGoal
    }

    amountTotal (timeSpan: HumanTimeSpan, currency: string): number {
        return this.operations
            .forTimeSpan(timeSpan)
            .sumExpenses(currency)
    }

    avgUntilToday (days: number, timeSpan: HumanTimeSpan, currency: string): number {
        const today = appState.today
        const endDate = timeSpan.endDate < today ? timeSpan.endDate : today

        const timeSpanDays = endDate.diff(timeSpan.startDate, 'days').days + 1

        return this.amountTotal(timeSpan, currency) * days / timeSpanDays
    }

    goal (days: number): Amount | null {
        if (this.perDayGoal === null) return null
        return { value: this.perDayGoal.value * days, currency: this.perDayGoal.currency }
    }

    leftPerDay (timeSpan: HumanTimeSpan, currency: string): Amount | null {
        const total = this.amountTotal(timeSpan, currency)
        const goal = this.goal(appState.timeSpan.totalDays)
        if (goal === null) return null
        return {
            value: (goal.value * currenciesModel.getRate(utcToday(), goal.currency, currency) - total) / appState.daysLeft,
            currency
        }
    }

    durationAvg (days: number, duration: DurationLikeObject, currency: string): number {
        return this.avgUntilToday(days, new LastPeriodTimeSpan(duration), currency)
    }

    * totalExpensesByDates (toCurrency: string): Generator<number | undefined> {
        let cumAmount = 0
        for (const amount of this.expensesByDate(toCurrency)) {
            if (amount === undefined) {
                yield undefined
                continue
            }

            cumAmount += amount
            yield cumAmount
        }
    }

    * expensesByDate (toCurrency: string): Generator<number | undefined> {
        const ops = [
            ...this.operations
                .forTimeSpan(appState.timeSpan)
                .operations()
        ]

        const today = appState.today

        if (ops.length === 0) {
            return [...appState.timeSpan.allDates()].map(() => 0)
        }

        let opIndex = 0
        for (const date of appState.timeSpan.allDates()) {
            if (date > today) {
                yield undefined
                continue
            }

            if (opIndex === ops.length) {
                yield 0
                continue
            }

            if (ops[opIndex].date > date) {
                yield 0
                continue
            }

            let amount = 0
            while (opIndex < ops.length && ops[opIndex].date <= date) {
                const op = ops[opIndex]

                if (op.type !== 'expense' && op.type !== 'income') {
                    continue
                }

                if (op.categories.length === 0) {
                    amount += op.amount * currenciesModel.getRate(op.date, op.currency, toCurrency)
                } else {
                    for (const c of op.categories) {
                        amount += c.amount * currenciesModel.getRate(op.date, op.currency, toCurrency)
                    }
                }

                opIndex += 1
            }
            yield amount
        }
    }

    static forCat (catOrCatName: string | Category): ExpensesStats {
        const cat = match(catOrCatName)
            .with(P.string, v => categoriesModel.get(v))
            .otherwise(v => v)
        return new ExpensesStats(
            Operations
                .all()
                .keepTypes('expense', 'income')
                .keepCategories(cat.name),
            match(cat.yearGoalUsd).with(undefined, () => null).otherwise(v => { return { value: v / 365, currency: 'USD' } })
        )
    }
}
