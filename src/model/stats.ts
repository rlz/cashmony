import { type DurationLikeObject } from 'luxon'
import { CategoriesModel } from './categories'
import { type NotDeletedOperation, type IncomeOperation, type ExpenseOperation, type TransferOperation, type AdjustmentOperation, type Category } from './model'
import { LastPeriodTimeSpan, type HumanTimeSpan } from '../helpers/dates'
import { OperationsModel } from './operations'
import { AppState } from './appState'
import { CurrenciesModel } from './currencies'
import { P, match } from 'ts-pattern'

const appState = AppState.instance()
const currenciesModel = CurrenciesModel.instance()
const categoriesModel = CategoriesModel.instance()
const operationsModel = OperationsModel.instance()

export class Operations<T extends IncomeOperation | ExpenseOperation | TransferOperation | AdjustmentOperation> {
    private readonly predicate: (op: NotDeletedOperation) => boolean

    private constructor (predicate: (op: NotDeletedOperation) => boolean) {
        this.predicate = predicate
    }

    static all (): Operations<IncomeOperation | ExpenseOperation | TransferOperation | AdjustmentOperation> {
        return new Operations(() => true)
    }

    forTimeSpan (timeSpan?: HumanTimeSpan): Operations<T> {
        if (timeSpan === undefined) {
            timeSpan = appState.timeSpan
        }

        const startDate = timeSpan.startDate
        const endDate = timeSpan.endDate

        return new Operations((op) => this.predicate(op) && op.date >= startDate && op.date <= endDate)
    }

    onlyExpenses (): Operations<IncomeOperation | ExpenseOperation> {
        return new Operations(
            op => this.predicate(op) && (
                op.type === 'expense' ||
                (op.type === 'income' && op.categories.length > 0)
            )
        )
    }

    forAccounts (...accounts: string[]): Operations<T> {
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

    excludeAccounts (...accounts: string[]): Operations<T> {
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

    forCategories (...categories: string[]): Operations<Exclude<T, TransferOperation | AdjustmentOperation>> {
        const categoriesSet = new Set(categories)
        return new Operations(
            op => this.predicate(op) &&
                (op.type === 'expense' || op.type === 'income') &&
                op.categories.some(cat => categoriesSet.has(cat.name))
        )
    }

    excludeCategories (...categories: string[]): Operations<Exclude<T, TransferOperation | AdjustmentOperation>> {
        const categoriesSet = new Set(categories)
        return new Operations(
            op => this.predicate(op) &&
                (op.type === 'expense' || op.type === 'income') &&
                !op.categories.some(cat => categoriesSet.has(cat.name))
        )
    }

    hasTags (...tags: string[]): Operations<T> {
        const tagsSet = new Set(tags)
        return new Operations(op => this.predicate(op) && op.tags.some(t => tagsSet.has(t)))
    }

    excludeTags (...tags: string[]): Operations<T> {
        const tagsSet = new Set(tags)
        return new Operations(op => this.predicate(op) && !op.tags.some(t => tagsSet.has(t)))
    }

    * operations (opts?: { reverse?: boolean }): Generator<T> {
        const ops = opts?.reverse === true
            ? [...operationsModel.operations].reverse()
            : operationsModel.operations

        for (const op of ops) {
            if (op.type === 'deleted') continue

            if (this.predicate(op)) {
                yield op as T
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
            if (op.categories.length === 0) {
                sum += op.amount * currenciesModel.getRate(op.date, op.currency, toCurrency)
                continue
            }

            for (const cat of op.categories) {
                const currency = categoriesModel.get(cat.name).currency
                sum += cat.amount * currenciesModel.getRate(op.date, currency, toCurrency)
            }
        }
        return sum
    }

    * groupByDate (opts?: { reverse?: boolean }): Generator<T[]> {
        let operations: T[] = []
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
    operations: Operations<IncomeOperation | ExpenseOperation>
    yearGoal: number | null

    constructor (operations: Operations<NotDeletedOperation>, yearGoal: number | null) {
        this.operations = operations.onlyExpenses()
        this.yearGoal = yearGoal
    }

    amountTotal (timeSpan?: HumanTimeSpan, currency?: string): number {
        return this.operations
            .forTimeSpan(timeSpan ?? appState.timeSpan)
            .sumExpenses(currency ?? appState.masterCurrency)
    }

    avgUntilToday (days: number, timeSpan?: HumanTimeSpan): number {
        timeSpan = timeSpan ?? appState.timeSpan

        const today = appState.today
        const endDate = timeSpan.endDate < today ? timeSpan.endDate : today

        const timeSpanDays = endDate.diff(timeSpan.startDate, 'days').days + 1

        return this.amountTotal(timeSpan) * days / timeSpanDays
    }

    goal (days: number): number | null {
        if (this.yearGoal === null) return null
        return this.yearGoal * days / appState.today.daysInYear
    }

    leftPerDay (): number | null {
        const total = this.amountTotal()
        const goal = this.goal(appState.timeSpan.totalDays)
        if (goal === null) return null
        return (goal - total) / appState.daysLeft
    }

    durationAvg (days: number, duration: DurationLikeObject): number {
        return this.avgUntilToday(days, new LastPeriodTimeSpan(duration))
    }

    * totalAmountByDates (toCurrency: string): Generator<number | undefined> {
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

                if (op.categories.length === 0) {
                    amount += op.amount * currenciesModel.getRate(op.date, op.currency, toCurrency)
                } else {
                    for (const c of op.categories) {
                        const catCurrency = categoriesModel.get(c.name).currency
                        amount += c.amount * currenciesModel.getRate(op.date, catCurrency, toCurrency)
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
            Operations.all().forCategories(cat.name),
            cat.yearGoal ?? null
        )
    }
}
