import { DateTime, type DurationLikeObject } from 'luxon'
import { match } from 'ts-pattern'

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
        if (operationsModel.operations === null) {
            throw Error('Operations not loaded')
        }

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

export function hasOperation (predicate: Predicate, timeSpan: HumanTimeSpan | null): boolean {
    const next = listOperations(predicate, timeSpan).next()
    return next.done !== true
}

export function * listOperations (predicate: Predicate, timeSpan: HumanTimeSpan | null): Generator<NotDeletedOperation> {
    if (operationsModel.operations === null) {
        throw Error('Operations not loaded')
    }

    const filter = compilePredicate(predicate)
    const [startDate, endDate] = (() => {
        if (timeSpan !== null) {
            return [timeSpan.startDate, timeSpan.endDate]
        }
        return [operationsModel.firstOp!.date, operationsModel.lastOp!.date]
    })()

    for (const op of operationsModel.operations) {
        if (
            op.type === 'deleted' ||
            op.date < startDate ||
            op.date > endDate ||
            !filter(op)
        ) {
            continue
        }

        yield op
    }
}

export type IntervalType = 'day' | 's-week' | 'm-week' | 'month' | 'year' | null

export interface Reducer<T> {
    interval: IntervalType
    reduce: (
        op: NotDeletedOperation | null,
        interval: DateTime,
        firstOp: boolean,
        intervalKind: 'past' | 'future' | 'now',
        result: T[]
    ) => Promise<void>
}

type InferReturnType<Type> = Type extends Record<string, Reducer<infer X>> ? { [key in keyof Type]: X[] } : never

export async function calcStats<T> (predicate: Predicate, timeSpan: HumanTimeSpan | null, today: DateTime, reducers: T): Promise<InferReturnType<T>> {
    if (operationsModel.operations === null) {
        throw Error('Operations not loaded')
    }

    const filter = compilePredicate(predicate)
    const [startDate, endDate] = (() => {
        if (timeSpan !== null) {
            return [timeSpan.startDate, timeSpan.endDate]
        }
        return [operationsModel.firstOp!.date, operationsModel.lastOp!.date]
    })()

    const values: Record<string, any[]> = {}
    for (const key of Object.keys(reducers as Record<string, unknown>)) {
        values[key] = []
    }

    let firstDay = true
    let index = 0

    let sWeekInterval = startDate.weekday === 7 ? startDate : startDate.minus({ days: startDate.weekday })
    let mWeekInterval = startDate.weekday === 1 ? startDate : startDate.minus({ days: startDate.weekday - 1 })
    let monthInterval = startDate.day === 1 ? startDate : startDate.minus({ days: startDate.day - 1 })
    let yearInterval = DateTime.utc(startDate.year)
    for (let date = startDate; date <= endDate; date = date.plus({ day: 1 })) {
        const sWeekStart = firstDay || date.weekday === 7
        const mWeekStart = firstDay || date.weekday === 1
        const monthStart = firstDay || date.day === 1
        const yearStart = firstDay || (date.month === 1 && date.day === 1)

        if (sWeekStart && !firstDay) {
            sWeekInterval = date
        }
        if (mWeekStart && !firstDay) {
            mWeekInterval = date
        }
        if (monthStart && !firstDay) {
            monthInterval = date
        }
        if (yearStart && !firstDay) {
            yearInterval = date
        }

        const dayKind = today < date ? 'future' : date < today ? 'past' : 'now'
        const sWeekKind = today < sWeekInterval ? 'future' : sWeekInterval.plus({ days: 6 }) < today ? 'past' : 'now'
        const mWeekKind = today < mWeekInterval ? 'future' : mWeekInterval.plus({ days: 6 }) < today ? 'past' : 'now'
        const monthKind = today < monthInterval ? 'future' : monthInterval.plus({ month: 1 }).minus({ day: 1 }) < today ? 'past' : 'now'
        const yearKind = today.year < yearInterval.year ? 'future' : yearInterval.year < today.year ? 'past' : 'now'

        let firstOp = true
        while (index < operationsModel.operations.length) {
            const op = operationsModel.operations[index]

            if (
                op.type === 'deleted' ||
                (startDate !== null && op.date < startDate) ||
                (endDate !== null && op.date > endDate) ||
                !filter(op)
            ) {
                index += 1
                continue
            }

            if (op.date.equals(date)) {
                index += 1
                const promises = Object.entries(reducers as Record<string, Reducer<any>>).map(async ([key, reducer]) => {
                    const interval = match(reducer.interval)
                        .with('day', () => date)
                        .with('s-week', () => sWeekInterval)
                        .with('m-week', () => mWeekInterval)
                        .with('month', () => monthInterval)
                        .with('year', () => yearInterval)
                        .with(null, () => startDate)
                        .exhaustive()
                    const firstOpInInterval = match(reducer.interval)
                        .with('day', () => firstOp)
                        .with('s-week', () => sWeekStart && firstOp)
                        .with('m-week', () => mWeekStart && firstOp)
                        .with('month', () => monthStart && firstOp)
                        .with('year', () => yearStart && firstOp)
                        .with(null, () => firstDay && firstOp)
                        .exhaustive()
                    const intervalKind = match<IntervalType, 'past' | 'future' | 'now'>(reducer.interval)
                        .with('day', () => dayKind)
                        .with('s-week', () => sWeekKind)
                        .with('m-week', () => mWeekKind)
                        .with('month', () => monthKind)
                        .with('year', () => yearKind)
                        .with(null, () => 'now')
                        .exhaustive()
                    await reducer.reduce(op, interval, firstOpInInterval, intervalKind, values[key])
                })
                await Promise.all(promises)
                firstOp = false
            }

            if (op.date > date) {
                break
            }
        }

        if (firstOp) {
            const promises = Object.entries(reducers as Record<string, Reducer<any>>).map(async ([key, reducer]) => {
                const interval = match(reducer.interval)
                    .with('day', () => date)
                    .with('s-week', () => sWeekInterval)
                    .with('m-week', () => mWeekInterval)
                    .with('month', () => monthInterval)
                    .with('year', () => yearInterval)
                    .with(null, () => startDate)
                    .exhaustive()
                const firstOpInInterval = match(reducer.interval)
                    .with('day', () => true)
                    .with('s-week', () => sWeekStart)
                    .with('m-week', () => mWeekStart)
                    .with('month', () => monthStart)
                    .with('year', () => yearStart)
                    .with(null, () => firstDay)
                    .exhaustive()
                const intervalKind = match<IntervalType, 'past' | 'future' | 'now'>(reducer.interval)
                    .with('day', () => dayKind)
                    .with('s-week', () => sWeekKind)
                    .with('m-week', () => mWeekKind)
                    .with('month', () => monthKind)
                    .with('year', () => yearKind)
                    .with(null, () => 'now')
                    .exhaustive()
                if (firstOpInInterval) {
                    await reducer.reduce(null, interval, true, intervalKind, values[key])
                }
            })
            await Promise.all(promises)
        }

        firstDay = false
    }

    return values as any
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
