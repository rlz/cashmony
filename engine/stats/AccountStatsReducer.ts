import { DateTime } from 'luxon'

import { HumanTimeSpan } from '../dates'
import { NotDeletedOperation } from '../model'
import { Point, TotalAndChangeStats } from './model'
import { Intervals, StatsReducer } from './newStatsProcessor'

export class AccountStatsReducer extends StatsReducer {
    private id: string
    private startDate: DateTime
    private endDate: DateTime
    readonly stats: TotalAndChangeStats

    constructor(id: string, currency: string, timeSpan: HumanTimeSpan, today: DateTime) {
        super()
        this.id = id
        this.startDate = timeSpan.startDate
        this.endDate = timeSpan.endDate
        this.stats = {
            currency,
            timeSpan,
            today,
            todayChange: 0,
            total: 0,
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
        if (op.account.id === this.id) {
            this.stats.total += op.account.amount
            if (op.date.toMillis() === this.stats.today.toMillis()) {
                this.stats.todayChange += op.account.amount
            }
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

        if (op.type !== 'transfer' || op.toAccount.id !== this.id) {
            return
        }

        this.stats.total += op.toAccount.amount
        if (op.date.toMillis() === this.stats.today.toMillis()) {
            this.stats.todayChange += op.toAccount.amount
        }
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
    amount.dayTotal.push({ date, value: amount.total })
}

function addSweek(amount: TotalAndChangeStats, date: DateTime): void {
    amount.sWeekChange.push({ date, value: 0 })
    amount.sWeekTotal.push({ date, value: amount.total })
}

function addMweek(amount: TotalAndChangeStats, date: DateTime): void {
    amount.mWeekChange.push({ date, value: 0 })
    amount.mWeekTotal.push({ date, value: amount.total })
}

function addMonth(amount: TotalAndChangeStats, date: DateTime): void {
    amount.monthChange.push({ date, value: 0 })
    amount.monthTotal.push({ date, value: amount.total })
}

function addToLast(values: Point[], change: number): void {
    values[values.length - 1].value += change
}
