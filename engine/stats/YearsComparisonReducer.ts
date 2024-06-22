import { CurrenciesLoader } from '../../currencies/currencies'
import { NotDeletedOperation } from '../model'
import { isExpense, isIncome } from '../predicateExpression'
import { Intervals, StatsReducer } from './stats'

export class YearsComparisonReducer extends StatsReducer {
    private readonly curency: string
    private readonly currenciesLoader: CurrenciesLoader

    readonly expenses: Record<number, number> = {}
    readonly incomes: Record<number, number> = {}

    private currentYear = 0

    constructor(currenciesLoader: CurrenciesLoader, currency: string) {
        super()
        this.curency = currency
        this.currenciesLoader = currenciesLoader
    }

    async newDay(intervals: Readonly<Intervals>): Promise<void> {
        this.currentYear = intervals.day.start.year
    }

    async process(op: NotDeletedOperation): Promise<void> {
        if (isExpense(op)) {
            const rate = await this.currenciesLoader.getRate(op.date, op.currency, this.curency)
            this.expenses[this.currentYear] = (this.expenses[this.currentYear] ?? 0) - op.amount * rate
        } else if (isIncome(op)) {
            const rate = await this.currenciesLoader.getRate(op.date, op.currency, this.curency)
            this.incomes[this.currentYear] = (this.incomes[this.currentYear] ?? 0) + op.amount * rate
        }
    }
}
