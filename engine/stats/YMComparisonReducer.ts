import { CurrenciesLoader } from '../../currencies/currencies'
import { NotDeletedOperation } from '../model'
import { isExpense, isIncome } from '../predicateExpression'
import { Intervals, StatsReducer } from './newStatsProcessor'

export class YMComparisonReducer extends StatsReducer {
    private curency: string
    readonly expenses: readonly Record<number, number>[]
    readonly incomes: readonly Record<number, number>[]

    private currentMonth = 0
    private currentYear = 0
    private firstDay = true
    private readonly currenciesLoader: CurrenciesLoader

    constructor(currenciesLoader: CurrenciesLoader, currency: string) {
        super()
        this.currenciesLoader = currenciesLoader
        this.curency = currency
        this.expenses = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
        this.incomes = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]
    }

    async newDay(intervals: Readonly<Intervals>): Promise<void> {
        if (this.firstDay || intervals.year.isFirstDay) {
            this.expenses.forEach(e => e[intervals.year.start.year] = 0)
            this.incomes.forEach(e => e[intervals.year.start.year] = 0)
        }
        this.firstDay = false

        this.currentMonth = intervals.day.start.month - 1
        this.currentYear = intervals.day.start.year
    }

    async process(op: NotDeletedOperation): Promise<void> {
        if (isExpense(op)) {
            const rate = await this.currenciesLoader.getRate(op.date, op.currency, this.curency)
            this.expenses[this.currentMonth][this.currentYear] -= op.amount * rate
        } else if (isIncome(op)) {
            const rate = await this.currenciesLoader.getRate(op.date, op.currency, this.curency)
            this.incomes[this.currentMonth][this.currentYear] += op.amount * rate
        }
    }
}
