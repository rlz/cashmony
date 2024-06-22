import { DateTime } from 'luxon'

import { CurrenciesLoader } from '../../currencies/currencies'
import { HumanTimeSpan } from '../dates'
import { Engine } from '../engine'
import { NotDeletedOperation } from '../model'
import { Point, TotalAndChangeStats } from './model'
import { Intervals, StatsReducer } from './newStatsProcessor'

export class AccountsStatsReducer extends StatsReducer {
    private timeSpan: HumanTimeSpan
    private startDate: DateTime<true>
    private endDate: DateTime<true>
    readonly total: TotalAndChangeStats
    readonly totalCurrency: string
    readonly accounts: Record<string, TotalAndChangeStats>
    private days: DateTime<true>[] = []
    private sWeeks: DateTime<true>[] = []
    private mWeeks: DateTime<true>[] = []
    private months: DateTime<true>[] = []
    private engine: Engine
    private today: DateTime<true>
    private currenciesLoader: CurrenciesLoader

    /**
     *
     * @param accounts id -> currency
     */
    constructor(accounts: Record<string, string>, currenciesLoader: CurrenciesLoader, timeSpan: HumanTimeSpan, totalCurrency: string, engine: Engine, today: DateTime<true>) {
        super()
        this.engine = engine
        this.timeSpan = timeSpan
        this.startDate = timeSpan.startDate
        this.endDate = timeSpan.endDate
        this.total = this.newAccountAmount(totalCurrency)
        this.totalCurrency = totalCurrency
        this.today = today
        this.accounts = Object.fromEntries(Object.entries(accounts).map(([id, currency]) => [id, this.newAccountAmount(currency)]))
        this.currenciesLoader = currenciesLoader
    }

    async newDay(intervals: Readonly<Intervals>, _init: boolean): Promise<void> {
        if (
            intervals.day.start < this.startDate
            || intervals.day.start > this.endDate
        ) {
            return
        }

        this.days.push(intervals.day.start)
        addDay(this.total, intervals.day.start)
        Object.values(this.accounts).forEach(a => addDay(a, intervals.day.start))

        if (intervals.day.start.toMillis() === this.startDate.toMillis() || intervals.sWeek.isFirstDay) {
            this.sWeeks.push(intervals.sWeek.start)
            addSweek(this.total, intervals.sWeek.start)
            Object.values(this.accounts).forEach(a => addSweek(a, intervals.sWeek.start))
        }

        if (intervals.day.start.toMillis() === this.startDate.toMillis() || intervals.mWeek.isFirstDay) {
            this.mWeeks.push(intervals.mWeek.start)
            addMweek(this.total, intervals.mWeek.start)
            Object.values(this.accounts).forEach(a => addMweek(a, intervals.mWeek.start))
        }

        if (intervals.day.start.toMillis() === this.startDate.toMillis() || intervals.month.isFirstDay) {
            this.months.push(intervals.month.start)
            addMonth(this.total, intervals.month.start)
            Object.values(this.accounts).forEach(a => addMonth(a, intervals.month.start))
        }
    }

    async process(op: NotDeletedOperation): Promise<void> {
        const account = this.accounts[op.account.id]
        account.total += op.account.amount
        if (op.date.toMillis() === account.today.toMillis()) {
            account.todayChange += op.account.amount
        }
        if (op.date >= this.startDate && op.date <= this.endDate) {
            addToLast(account.dayChange, op.account.amount)
            addToLast(account.dayTotal, op.account.amount)
            addToLast(account.sWeekChange, op.account.amount)
            addToLast(account.sWeekTotal, op.account.amount)
            addToLast(account.mWeekChange, op.account.amount)
            addToLast(account.mWeekTotal, op.account.amount)
            addToLast(account.monthChange, op.account.amount)
            addToLast(account.monthTotal, op.account.amount)
        }

        if (op.type !== 'transfer') {
            return
        }

        const toAccount = this.accounts[op.toAccount.id]
        toAccount.total += op.toAccount.amount
        if (op.date.toMillis() === this.today.toMillis()) {
            toAccount.todayChange += op.toAccount.amount
        }
        if (op.date >= this.startDate && op.date <= this.endDate) {
            addToLast(toAccount.dayChange, op.toAccount.amount)
            addToLast(toAccount.dayTotal, op.toAccount.amount)
            addToLast(toAccount.sWeekChange, op.toAccount.amount)
            addToLast(toAccount.sWeekTotal, op.toAccount.amount)
            addToLast(toAccount.mWeekChange, op.toAccount.amount)
            addToLast(toAccount.mWeekTotal, op.toAccount.amount)
            addToLast(toAccount.monthChange, op.toAccount.amount)
            addToLast(toAccount.monthTotal, op.toAccount.amount)
        }
    }

    async done(): Promise<void> {
        const ratesCache: Record<string, number> = {}
        const getRate = async (date: DateTime, fromCur: string, toCur: string): Promise<number> => {
            const key = `${date.toISO()}-${fromCur}-${toCur}`
            if (!(key in ratesCache)) {
                ratesCache[key] = await this.currenciesLoader.getRate(date, fromCur, toCur)
            }
            return ratesCache[key]
        }

        for (const [id, stats] of Object.entries(this.accounts)) {
            const accCur = this.engine.getAccount(id).currency
            const rate = await getRate(this.engine.lastOp?.date ?? this.today, accCur, this.totalCurrency)
            this.total.total += stats.total * rate

            for (let i = 0; i < stats.dayChange.length; ++i) {
                const r = await getRate(stats.dayChange[i].date, accCur, this.totalCurrency)
                this.total.dayTotal[i].value += stats.dayTotal[i].value * r
                this.total.dayChange[i].value = i === 0
                    ? this.total.dayChange[i].value + stats.dayChange[i].value * r
                    : this.total.dayTotal[i].value - this.total.dayTotal[i - 1].value
            }

            for (let i = 0; i < stats.sWeekChange.length; ++i) {
                const d = stats.sWeekChange[i].date.plus({ days: 6 })
                const r = await getRate(d < this.today ? d : this.today, accCur, this.totalCurrency)
                this.total.sWeekTotal[i].value += stats.sWeekTotal[i].value * r
                this.total.sWeekChange[i].value = i === 0
                    ? this.total.sWeekChange[i].value + stats.sWeekChange[i].value * r
                    : this.total.sWeekTotal[i].value - this.total.sWeekTotal[i - 1].value
            }

            for (let i = 0; i < stats.mWeekChange.length; ++i) {
                const d = stats.mWeekChange[i].date.plus({ days: 6 })
                const r = await getRate(d < this.today ? d : this.today, accCur, this.totalCurrency)
                this.total.mWeekTotal[i].value += stats.mWeekTotal[i].value * r
                this.total.mWeekChange[i].value = i === 0
                    ? this.total.mWeekChange[i].value + stats.mWeekChange[i].value * r
                    : this.total.mWeekTotal[i].value - this.total.mWeekTotal[i - 1].value
            }

            for (let i = 0; i < stats.monthChange.length; ++i) {
                const d = stats.monthChange[i].date.endOf('month').startOf('day')
                const r = await getRate(d < this.today ? d : this.today, accCur, this.totalCurrency)
                this.total.monthTotal[i].value += stats.monthTotal[i].value * r
                this.total.monthChange[i].value = i === 0
                    ? this.total.monthChange[i].value + stats.monthChange[i].value * r
                    : this.total.monthTotal[i].value - this.total.monthTotal[i - 1].value
            }
        }
    }

    private newAccountAmount(currency: string): TotalAndChangeStats {
        return {
            currency,
            timeSpan: this.timeSpan,
            today: this.today,
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
