import { DateTime } from 'luxon'

import { HumanTimeSpan } from '../../helpers/dates'
import { NotDeletedOperation } from '../model'
import { Intervals, StatsReducer } from '../newStatsProcessor'
import { Point, TotalAndChangeStats } from './data'

export class AccountStatsReducer extends StatsReducer {
    private name: string
    private startDate: DateTime
    private endDate: DateTime
    readonly stats: TotalAndChangeStats

    constructor(name: string, timeSpan: HumanTimeSpan) {
        super()
        this.name = name
        this.startDate = timeSpan.startDate
        this.endDate = timeSpan.endDate
        this.stats = {
            last: 0,
            dayChange: [],
            sWeekChange: [],
            mWeekChange: [],
            monthChange: [],
            dayTotal: [],
            sWeekTotal: [],
            mWeekTotal: [],
            monthTotal: []
        }
    }

    async newDay(intervals: Readonly<Intervals>, _init: boolean): Promise<void> {
        if (
            intervals.day.start < this.startDate
            || intervals.day.start > this.endDate
        ) {
            return
        }

        addDay(this.stats, intervals.day.start)

        if (intervals.day.start.toMillis() === this.startDate.toMillis() || intervals.sWeek.isFirstDay) {
            addSweek(this.stats, intervals.sWeek.start)
        }

        if (intervals.day.start.toMillis() === this.startDate.toMillis() || intervals.mWeek.isFirstDay) {
            addMweek(this.stats, intervals.mWeek.start)
        }

        if (intervals.day.start.toMillis() === this.startDate.toMillis() || intervals.month.isFirstDay) {
            addMonth(this.stats, intervals.month.start)
        }
    }

    async process(op: NotDeletedOperation): Promise<void> {
        if (op.account.name === this.name) {
            this.stats.last += op.account.amount
            if (op.date >= this.startDate && op.date <= this.endDate) {
                addToLast(this.stats.dayChange, op.account.amount)
                addToLast(this.stats.dayTotal, op.account.amount)
                addToLast(this.stats.sWeekChange, op.account.amount)
                addToLast(this.stats.sWeekTotal, op.account.amount)
                addToLast(this.stats.mWeekChange, op.account.amount)
                addToLast(this.stats.mWeekTotal, op.account.amount)
                addToLast(this.stats.monthChange, op.account.amount)
                addToLast(this.stats.monthTotal, op.account.amount)
            }
        }

        if (op.type !== 'transfer' || op.toAccount.name !== this.name) {
            return
        }

        this.stats.last += op.toAccount.amount
        if (op.date >= this.startDate && op.date <= this.endDate) {
            addToLast(this.stats.dayChange, op.toAccount.amount)
            addToLast(this.stats.dayTotal, op.toAccount.amount)
            addToLast(this.stats.sWeekChange, op.toAccount.amount)
            addToLast(this.stats.sWeekTotal, op.toAccount.amount)
            addToLast(this.stats.mWeekChange, op.toAccount.amount)
            addToLast(this.stats.mWeekTotal, op.toAccount.amount)
            addToLast(this.stats.monthChange, op.toAccount.amount)
            addToLast(this.stats.monthTotal, op.toAccount.amount)
        }
    }
}

function addDay(amount: TotalAndChangeStats, date: DateTime): void {
    amount.dayChange.push({ date, value: 0 })
    amount.dayTotal.push({ date, value: amount.last })
}

function addSweek(amount: TotalAndChangeStats, date: DateTime): void {
    amount.sWeekChange.push({ date, value: 0 })
    amount.sWeekTotal.push({ date, value: amount.last })
}

function addMweek(amount: TotalAndChangeStats, date: DateTime): void {
    amount.mWeekChange.push({ date, value: 0 })
    amount.mWeekTotal.push({ date, value: amount.last })
}

function addMonth(amount: TotalAndChangeStats, date: DateTime): void {
    amount.monthChange.push({ date, value: 0 })
    amount.monthTotal.push({ date, value: amount.last })
}

function addToLast(values: Point[], change: number): void {
    values[values.length - 1].value += change
}
