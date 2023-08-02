import { DateTime } from 'luxon'
import { match } from 'ts-pattern'

import { type HumanTimeSpan } from '../helpers/dates'
import { type NotDeletedOperation } from './model'
import { OperationsModel } from './operations'
import { compilePredicate, type Predicate } from './predicateExpression'

const operationsModel = OperationsModel.instance()

export function hasOperation (predicate: Predicate, timeSpan: HumanTimeSpan | null): boolean {
    const next = listOperations(predicate, timeSpan).next()
    return next.done !== true
}

export function countOperations (predicate: Predicate, timeSpan: HumanTimeSpan | null): number {
    let count = 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _op of listOperations(predicate, timeSpan)) {
        count += 1
    }
    return count
}

export function * listOperations (predicate: Predicate, timeSpan: HumanTimeSpan | null): Generator<NotDeletedOperation> {
    if (operationsModel.operations === null) {
        throw Error('Operations not loaded')
    }

    const filter = compilePredicate(predicate)

    for (const op of operationsModel.operations) {
        if (
            op.type === 'deleted' ||
            (timeSpan !== null && op.date < timeSpan.startDate) ||
            (timeSpan !== null && op.date > timeSpan.endDate) ||
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
    done?: (result: T[]) => Promise<void>
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

    const promises = Object.entries(reducers as Record<string, Reducer<any>>).map(async ([key, reducer]) => {
        if (reducer.done !== undefined) {
            await reducer.done(values[key])
        }
    })
    await Promise.all(promises)

    return values as any
}
