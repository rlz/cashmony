import { CurrenciesModel } from '../currencies'
import { NotDeletedOperation } from '../model'
import { Intervals, StatsReducer } from '../newStatsProcessor'
import { isExpense, isIncome } from '../predicateExpression'

const currenciesModel = CurrenciesModel.instance()

export class YearsComparisonReducer extends StatsReducer {
    private curency: string
    readonly expenses: Record<number, number> = {}
    readonly incomes: Record<number, number> = {}

    private currentYear = 0

    constructor(currency: string) {
        super()
        this.curency = currency
    }

    async newDay(intervals: Readonly<Intervals>): Promise<void> {
        this.currentYear = intervals.day.start.year
    }

    async process(op: NotDeletedOperation): Promise<void> {
        if (isExpense(op)) {
            const rate = await currenciesModel.getRate(op.date, op.currency, this.curency)
            this.expenses[this.currentYear] = (this.expenses[this.currentYear] ?? 0) - op.amount * rate
        } else if (isIncome(op)) {
            const rate = await currenciesModel.getRate(op.date, op.currency, this.curency)
            this.incomes[this.currentYear] = (this.incomes[this.currentYear] ?? 0) + op.amount * rate
        }
    }
}
