import { DateTime } from 'luxon'

import { Point } from '../../widgets/plots/PlotUtils'
import { CurrenciesModel } from '../currencies'
import { NotDeletedOperation } from '../model'
import { Intervals, StatsReducer } from '../newStatsProcessor'
import { isExpense, isIncome } from '../predicateExpression'

export interface TotalAndChangeStats {
    dayChange: Point[]
    sWeekChange: Point[]
    mWeekChange: Point[]
    monthChange: Point[]
    dayTotal: Point[]
    sWeekTotal: Point[]
    mWeekTotal: Point[]
    monthTotal: Point[]
}

const currenciesModel = CurrenciesModel.instance()

export class MainChangeReducer extends StatsReducer {
    private currency: string
    totalExpense: number = 0
    totalIncome: number = 0
    readonly expense: TotalAndChangeStats
    readonly income: TotalAndChangeStats

    constructor(currency: string) {
        super()
        this.currency = currency
        this.expense = {
            dayChange: [],
            sWeekChange: [],
            mWeekChange: [],
            monthChange: [],
            dayTotal: [],
            sWeekTotal: [],
            mWeekTotal: [],
            monthTotal: []
        }
        this.income = {
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
        addDay(this.expense, intervals.day.start, this.totalExpense)
        addDay(this.income, intervals.day.start, this.totalIncome)

        if (init || intervals.sWeek.isFirstDay) {
            addSweek(this.expense, intervals.sWeek.start, this.totalExpense)
            addSweek(this.income, intervals.sWeek.start, this.totalIncome)
        }

        if (init || intervals.mWeek.isFirstDay) {
            addMweek(this.expense, intervals.mWeek.start, this.totalExpense)
            addMweek(this.income, intervals.mWeek.start, this.totalIncome)
        }

        if (init || intervals.month.isFirstDay) {
            addMonth(this.expense, intervals.month.start, this.totalExpense)
            addMonth(this.income, intervals.month.start, this.totalIncome)
        }
    }

    async process(op: NotDeletedOperation): Promise<void> {
        let stats

        const rate = await currenciesModel.getRate(op.date, op.currency, this.currency)
        let amount = op.amount * rate

        if (isExpense(op)) {
            amount = -amount
            this.totalExpense += amount
            stats = this.expense
        } else if (isIncome(op)) {
            this.totalIncome += amount
            stats = this.income
        } else {
            return
        }

        addToLast(stats.dayChange, amount)
        addToLast(stats.dayTotal, amount)
        addToLast(stats.sWeekChange, amount)
        addToLast(stats.sWeekTotal, amount)
        addToLast(stats.mWeekChange, amount)
        addToLast(stats.mWeekTotal, amount)
        addToLast(stats.monthChange, amount)
        addToLast(stats.monthTotal, amount)
    }
}

function addDay(amount: TotalAndChangeStats, date: DateTime, last: number): void {
    amount.dayChange.push({ date, value: 0 })
    amount.dayTotal.push({ date, value: last })
}

function addSweek(amount: TotalAndChangeStats, date: DateTime, last: number): void {
    amount.sWeekChange.push({ date, value: 0 })
    amount.sWeekTotal.push({ date, value: last })
}

function addMweek(amount: TotalAndChangeStats, date: DateTime, last: number): void {
    amount.mWeekChange.push({ date, value: 0 })
    amount.mWeekTotal.push({ date, value: last })
}

function addMonth(amount: TotalAndChangeStats, date: DateTime, last: number): void {
    amount.monthChange.push({ date, value: 0 })
    amount.monthTotal.push({ date, value: last })
}

function addToLast(values: Point[], change: number): void {
    values[values.length - 1].value += change
}
