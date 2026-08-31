import { DateTime } from 'luxon'
import { expect, test } from 'vitest'

import { toValid } from '../../common/dates.js'
import { CustomTimeSpan } from '../dates.js'
import { Engine } from '../engine.js'
import { DeletedOperation, ExpenseOperation, IncomeOperation, NotDeletedOperation } from '../model.js'
import { PE } from '../predicateExpression.js'
import { calcStats, Intervals, StatsReducer } from './stats.js'

class RecordingReducer extends StatsReducer {
    readonly days: { date: string, init: boolean, intervals: Intervals }[] = []
    readonly processed: string[] = []
    doneCalled = false

    override async newDay(intervals: Readonly<Intervals>, init: boolean): Promise<void> {
        this.days.push({
            date: intervals.day.start.toISODate(),
            init,
            intervals
        })
    }

    override async process(op: NotDeletedOperation): Promise<void> {
        this.processed.push(op.id)
    }

    override async done(): Promise<void> {
        this.doneCalled = true
    }
}

function expense(id: string, date: DateTime<true>): ExpenseOperation {
    return {
        id,
        type: 'expense',
        lastModified: DateTime.utc(),
        date,
        amount: -10,
        currency: 'USD',
        account: { id: 'account', amount: -10 },
        categories: [],
        tags: [],
        comment: null
    }
}

function income(id: string, date: DateTime<true>): IncomeOperation {
    return {
        ...expense(id, date),
        type: 'income',
        amount: 10,
        account: { id: 'account', amount: 10 }
    }
}

function deleted(id: string): DeletedOperation {
    return {
        id,
        type: 'deleted',
        lastModified: DateTime.utc()
    }
}

test('runs reducers for every day and calculates calendar interval boundaries', async () => {
    const engine = new Engine()
    engine.init([], [], [], [])
    const reducer = new RecordingReducer()
    const span = new CustomTimeSpan(DateTime.utc(2026, 1, 31), DateTime.utc(2026, 2, 2))

    await calcStats(engine, PE.any(), span, toValid(DateTime.utc(2026, 2, 1)), [reducer])

    expect(reducer.days.map(day => ({ date: day.date, init: day.init }))).toEqual([
        { date: '2026-01-31', init: true },
        { date: '2026-02-01', init: false },
        { date: '2026-02-02', init: false }
    ])
    expect(reducer.days.map(day => ({
        day: {
            start: day.intervals.day.start.toISODate(),
            first: day.intervals.day.isFirstDay,
            past: day.intervals.day.isPast,
            now: day.intervals.day.isNow,
            future: day.intervals.day.isFuture
        },
        sWeek: {
            start: day.intervals.sWeek.start.toISODate(),
            first: day.intervals.sWeek.isFirstDay
        },
        mWeek: {
            start: day.intervals.mWeek.start.toISODate(),
            first: day.intervals.mWeek.isFirstDay
        },
        month: {
            start: day.intervals.month.start.toISODate(),
            first: day.intervals.month.isFirstDay
        }
    }))).toEqual([
        {
            day: { start: '2026-01-31', first: true, past: true, now: false, future: false },
            sWeek: { start: '2026-01-25', first: false },
            mWeek: { start: '2026-01-26', first: false },
            month: { start: '2026-01-01', first: false }
        },
        {
            day: { start: '2026-02-01', first: true, past: false, now: true, future: false },
            sWeek: { start: '2026-02-01', first: true },
            mWeek: { start: '2026-01-26', first: false },
            month: { start: '2026-02-01', first: true }
        },
        {
            day: { start: '2026-02-02', first: true, past: false, now: false, future: true },
            sWeek: { start: '2026-02-01', first: false },
            mWeek: { start: '2026-02-02', first: true },
            month: { start: '2026-02-01', first: false }
        }
    ])
    expect(reducer.doneCalled).toBe(true)
})

test('processes only matching, non-deleted operations within the time span in date order', async () => {
    const engine = new Engine()
    const februaryFirst = toValid(DateTime.utc(2026, 2, 1))
    const februarySecond = toValid(DateTime.utc(2026, 2, 2))

    engine.init([], [], [
        expense('after-span', toValid(DateTime.utc(2026, 2, 3))),
        income('wrong-type', februaryFirst),
        deleted('removed'),
        expense('before-span', toValid(DateTime.utc(2026, 1, 31))),
        expense('second-day', februarySecond),
        expense('first-day', februaryFirst)
    ], [])
    const reducer = new RecordingReducer()
    const span = new CustomTimeSpan(februaryFirst, februarySecond)

    await calcStats(engine, PE.type('expense'), span, februaryFirst, [reducer])

    expect(reducer.processed).toEqual(['first-day', 'second-day'])
    expect(reducer.doneCalled).toBe(true)
})

test('requires an initialized engine', async () => {
    await expect(calcStats(
        new Engine(),
        PE.any(),
        new CustomTimeSpan(DateTime.utc(2026, 2, 1), DateTime.utc(2026, 2, 1)),
        toValid(DateTime.utc(2026, 2, 1)),
        []
    )).rejects.toThrow('Uninitialized engine')
})
