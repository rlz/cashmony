import { type DurationLikeObject } from 'luxon'

import { type HumanTimeSpan, LastPeriodTimeSpan, utcToday } from '../helpers/dates'
import { AppState } from './appState'
import { CurrenciesModel } from './currencies'
import { type Amount, type NotDeletedOperation } from './model'
import { OperationsModel } from './operations'
import { compilePredicate, PE, type Predicate } from './predicateExpression'

const appState = AppState.instance()
const currenciesModel = CurrenciesModel.instance()
const operationsModel = OperationsModel.instance()

export class Operations {
    private readonly timeSpan?: HumanTimeSpan
    private readonly filter: (op: NotDeletedOperation) => boolean

    readonly predicate: Predicate

    private constructor (predicate: Predicate, timeSpan?: HumanTimeSpan) {
        this.timeSpan = timeSpan
        this.predicate = predicate
        this.filter = compilePredicate(predicate)
    }

    static get (predicate: Predicate, timeSpan?: HumanTimeSpan): Operations {
        return new Operations(predicate, timeSpan)
    }

    onlyExpenses (): Operations {
        const expensesPredicate = PE.or(PE.type('expense'), PE.and(PE.type('income')))
        return Operations.get(
            PE.and(this.predicate, expensesPredicate),
            this.timeSpan
        )
    }

    forTimeSpan (timeSpan: HumanTimeSpan): Operations {
        return Operations.get(this.predicate, timeSpan)
    }

    * operations (opts?: { reverse?: boolean }): Generator<NotDeletedOperation> {
        const ops = opts?.reverse === true
            ? [...operationsModel.operations].reverse()
            : operationsModel.operations

        const startDate = this.timeSpan?.startDate
        const endDate = this.timeSpan?.endDate

        for (const op of ops) {
            if (op.type === 'deleted') continue

            if (
                (startDate === undefined || op.date >= startDate) &&
                (endDate === undefined || op.date <= endDate) &&
                this.filter(op)
            ) {
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

    sumOpExpenses (toCurrency: string): number {
        let sum = 0
        for (const op of this.onlyExpenses().operations()) {
            sum += op.amount * currenciesModel.getRate(op.date, op.currency, toCurrency)
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
            .sumOpExpenses(currency)
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
}
