import { DateTime } from 'luxon'

import { HumanTimeSpan } from '../helpers/dates'
import { AppState } from './appState'
import { NotDeletedOperation } from './model'
import { OperationsModel } from './operations'
import { compilePredicate, Predicate } from './predicateExpression'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()

interface Interval {
    start: DateTime
    isFirstDay: boolean
    isPast: boolean
    isNow: boolean
    isFuture: boolean
}

export interface Intervals {
    day: Interval
    sWeek: Interval
    mWeek: Interval
    month: Interval
    year: Interval
}

export class StatsReducer {
    newDay(_intervals: Readonly<Intervals>): void {}
    async process(_op: NotDeletedOperation): Promise<void> {}
    done(): void {}
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

    const intervals: Intervals = {
        day: {
            start: startDate,
            isFirstDay: true,
            isPast: true,
            isNow: true,
            isFuture: true
        },
        sWeek: {
            start: startDate.weekday === 7 ? startDate : startDate.minus({ days: startDate.weekday }),
            isFirstDay: true,
            isPast: true,
            isNow: true,
            isFuture: true
        },
        mWeek: {
            start: startDate.startOf('week'),
            isFirstDay: true,
            isPast: true,
            isNow: true,
            isFuture: true
        },
        month: {
            start: startDate.startOf('month'),
            isFirstDay: true,
            isPast: true,
            isNow: true,
            isFuture: true
        },
        year: {
            start: startDate.startOf('year'),
            isFirstDay: true,
            isPast: true,
            isNow: true,
            isFuture: true
        }
    }

    let index = 0
    for (let date = startDate; date <= endDate; date = date.plus({ day: 1 })) {
        // intervals.day.isFirstDay = true
        intervals.day.start = date
        intervals.sWeek.isFirstDay = date.weekday === 7
        if (intervals.sWeek.isFirstDay) {
            intervals.sWeek.start = date
        }
        intervals.mWeek.isFirstDay = date.weekday === 1
        if (intervals.mWeek.isFirstDay) {
            intervals.mWeek.start = date
        }
        intervals.month.isFirstDay = date.day === 1
        if (intervals.month.isFirstDay) {
            intervals.month.start = date
        }
        intervals.year.isFirstDay = date.month === 1 && date.day === 1
        if (intervals.year.isFirstDay) {
            intervals.year.start = date
        }

        intervals.day.isFuture = today < intervals.day.start
        intervals.day.isPast = today > intervals.day.start
        intervals.day.isNow = !intervals.day.isFuture && !intervals.day.isPast

        intervals.sWeek.isFuture = today < intervals.sWeek.start
        intervals.sWeek.isPast = intervals.sWeek.start.plus({ days: 6 }) < today
        intervals.sWeek.isNow = !intervals.sWeek.isFuture && !intervals.sWeek.isPast

        intervals.mWeek.isFuture = today < intervals.mWeek.start
        intervals.mWeek.isPast = intervals.mWeek.start.plus({ days: 6 }) < today
        intervals.mWeek.isNow = !intervals.mWeek.isFuture && !intervals.mWeek.isPast

        intervals.month.isFuture = today < intervals.month.start
        intervals.month.isPast = intervals.month.start.plus({ month: 1 }).minus({ day: 1 }) < today
        intervals.month.isNow = !intervals.month.isFuture && !intervals.month.isPast

        intervals.year.isFuture = today.year < intervals.year.start.year
        intervals.year.isPast = intervals.year.start.year < today.year
        intervals.year.isNow = !intervals.year.isFuture && !intervals.year.isPast

        reducers.forEach(reducer => reducer.newDay(intervals))

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

    reducers.forEach(r => r.done())
}
