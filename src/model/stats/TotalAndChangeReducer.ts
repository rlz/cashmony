import { DateTime } from 'luxon'

import { CurrenciesModel } from '../currencies'
import { NotDeletedOperation } from '../model'
import { Intervals, StatsReducer } from '../newStatsProcessor'
import { compilePredicate, Predicate } from '../predicateExpression'
import { Point, TotalAndChangeStats } from './data'

const currenciesModel = CurrenciesModel.instance()

export class TotalAndChangeReducer extends StatsReducer {
    private predicate: (op: NotDeletedOperation) => boolean
    private currency: string
    private multiplier: 1 | -1
    readonly stats: TotalAndChangeStats

    constructor(predicate: Predicate, currency: string, reverse?: boolean) {
        super()
        this.predicate = compilePredicate(predicate)
        this.currency = currency
        this.multiplier = reverse ? -1 : 1
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

    async newDay(intervals: Readonly<Intervals>, init: boolean): Promise<void> {
        addDay(this.stats, intervals.day.start)

        if (init || intervals.sWeek.isFirstDay) {
            addSweek(this.stats, intervals.sWeek.start)
        }

        if (init || intervals.mWeek.isFirstDay) {
            addMweek(this.stats, intervals.mWeek.start)
        }

        if (init || intervals.month.isFirstDay) {
            addMonth(this.stats, intervals.month.start)
        }
    }

    async process(op: NotDeletedOperation): Promise<void> {
        if (op.type === 'transfer' || op.type === 'adjustment' || !this.predicate(op)) {
            return
        }

        const rate = await currenciesModel.getRate(op.date, op.currency, this.currency)
        const amount = this.multiplier * op.amount * rate

        this.stats.last += amount
        addToLast(this.stats.dayChange, amount)
        addToLast(this.stats.dayTotal, amount)
        addToLast(this.stats.sWeekChange, amount)
        addToLast(this.stats.sWeekTotal, amount)
        addToLast(this.stats.mWeekChange, amount)
        addToLast(this.stats.mWeekTotal, amount)
        addToLast(this.stats.monthChange, amount)
        addToLast(this.stats.monthTotal, amount)
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
