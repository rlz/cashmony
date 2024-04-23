import { DateTime } from 'luxon'

import { HumanTimeSpan } from '../helpers/dates'
import { AppState } from './appState'
import { NotDeletedOperation } from './model'
import { OperationsModel } from './operations'
import { compilePredicate, Predicate } from './predicateExpression'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()

interface Interval {
    readonly start: DateTime
    readonly isFirstDay: boolean
    readonly isPast: boolean
    readonly isNow: boolean
    readonly isFuture: boolean
}

export interface Intervals {
    readonly day: Interval
    readonly sWeek: Interval
    readonly mWeek: Interval
    readonly month: Interval
    readonly year: Interval
}

export class StatsReducer {
    async newDay(_intervals: Readonly<Intervals>, _init: boolean): Promise<void> {}
    async process(_op: NotDeletedOperation): Promise<void> {}
    async done(): Promise<void> {}
}

export async function calcStats2(
    predicate: Predicate,
    timeSpan: HumanTimeSpan | null,
    today: DateTime,
    reducers: readonly StatsReducer[]
): Promise<void> {
    if (operationsModel.operations === null) {
        throw Error('Operations not loaded')
    }

    const filter = compilePredicate(predicate)
    const [startDate, endDate] = (() => {
        if (timeSpan !== null) {
            return [timeSpan.startDate, timeSpan.endDate]
        }
        return [operationsModel.firstOp?.date ?? appState.today, operationsModel.lastOp?.date ?? appState.today]
    })()

    let init = true
    let index = 0
    for (let date = startDate; date <= endDate; date = date.plus({ day: 1 })) {
        const intervals = calcIntervals(date, today)
        await Promise.all(reducers.map(reducer => reducer.newDay(intervals, init)))
        init = false

        while (index < operationsModel.operations.length) {
            const op = operationsModel.operations[index]

            if (
                op.type === 'deleted'
                || (startDate !== null && op.date < startDate)
                || (endDate !== null && op.date > endDate)
                || !filter(op)
            ) {
                index += 1
                continue
            }

            if (op.date.equals(date)) {
                index += 1

                await Promise.all(
                    reducers.map(reducer => reducer.process(op))
                )
            }

            if (op.date > date) {
                break
            }
        }
    }

    await Promise.all(reducers.map(r => r.done()))
}

function calcIntervals(date: DateTime, today: DateTime): Intervals {
    const sWeekFirstDay = date.weekday === 7
    const mWeekFirstDay = date.weekday === 1
    const monthFirstDay = date.day === 1
    const yearFirstDay = date.month === 1 && date.day === 1

    const sWeekStart = date.weekday === 7 ? date : date.minus({ days: date.weekday })
    const mWeekStart = date.startOf('week')
    const monthStart = date.startOf('month')
    const yearStart = date.startOf('year')

    const dayFuture = today < date
    const dayPast = today > date
    const dayNow = !dayFuture && !dayPast

    const sWeekFuture = today < sWeekStart
    const sWeekPast = sWeekStart.plus({ days: 6 }) < today
    const sWeekNow = !sWeekFuture && !sWeekPast

    const mWeekFuture = today < mWeekStart
    const mWeekPast = mWeekStart.plus({ days: 6 }) < today
    const mWeekNow = !mWeekFuture && !mWeekPast

    const monthFuture = today < monthStart
    const monthPast = monthStart.plus({ month: 1 }).minus({ day: 1 }) < today
    const monthNow = !monthFuture && !monthPast

    const yearFuture = today.year < yearStart.year
    const yearPast = yearStart.year < today.year
    const yearNow = !yearFuture && !yearPast

    return {
        day: {
            start: date,
            isFirstDay: true,
            isPast: dayPast,
            isNow: dayNow,
            isFuture: dayFuture
        },
        sWeek: {
            start: sWeekStart,
            isFirstDay: sWeekFirstDay,
            isPast: sWeekPast,
            isNow: sWeekNow,
            isFuture: sWeekFuture
        },
        mWeek: {
            start: mWeekStart,
            isFirstDay: mWeekFirstDay,
            isPast: mWeekPast,
            isNow: mWeekNow,
            isFuture: mWeekFuture
        },
        month: {
            start: monthStart,
            isFirstDay: monthFirstDay,
            isPast: monthPast,
            isNow: monthNow,
            isFuture: monthFuture
        },
        year: {
            start: yearStart,
            isFirstDay: yearFirstDay,
            isPast: yearPast,
            isNow: yearNow,
            isFuture: yearFuture
        }
    }
}
