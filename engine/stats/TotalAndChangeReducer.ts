import { DateTime } from 'luxon'

import { CurrenciesLoader } from '../../currencies/currencies'
import { HumanTimeSpan } from '../dates'
import { Engine } from '../engine'
import { NotDeletedOperation } from '../model'
import { compilePredicate, Predicate } from '../predicateExpression'
import { Point, TotalAndChangeStats } from './model'
import { Intervals, StatsReducer } from './newStatsProcessor'

export class TotalAndChangeReducer extends StatsReducer {
    private predicate: (op: NotDeletedOperation) => boolean
    private currency: string
    readonly stats: TotalAndChangeStats
    private readonly currenciesLoader: CurrenciesLoader

    constructor(engine: Engine, currenciesLoader: CurrenciesLoader, today: DateTime, timeSpan: HumanTimeSpan, predicate: Predicate, currency: string) {
        super()
        this.predicate = compilePredicate(predicate, engine)
        this.currency = currency
        this.stats = {
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
        this.currenciesLoader = currenciesLoader
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

        const rate = await this.currenciesLoader.getRate(op.date, op.currency, this.currency)
        const amount = op.amount * rate

        this.stats.total += amount
        if (op.date.toMillis() === this.stats.today.toMillis()) {
            this.stats.todayChange += amount
        }
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
