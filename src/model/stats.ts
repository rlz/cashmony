import { type DateTime } from 'luxon'
import { CategoriesModel } from './categories'
import { type NotDeletedOperation, type Category } from './model'
import { utcToday } from '../helpers/dates'
import { OperationsModel } from './operations'
import { AppState } from './appState'

const appState = AppState.instance()
const categoriesModel = CategoriesModel.instance()
const operationsModel = OperationsModel.instance()

export class CatMonthStats {
    private _allDays: DateTime[] | null = null
    private _amountsByDay: Array<number | undefined> | null = null
    private _amountsByDayFromZero: Array<number | undefined> | null = null

    startOfMonth: DateTime
    endOfMonth: DateTime
    category: Category

    constructor (category: Category, date: DateTime) {
        this.startOfMonth = date.set({ day: 1 }).minus({ day: 1 })
        this.endOfMonth = date.set({ day: date.daysInMonth })
        this.category = category
    }

    get startAmount (): number {
        const startOfMonth = this.startOfMonth
        return categoriesModel.getAmounts(startOfMonth).get(this.category.name) ?? 0
    }

    get endAmount (): number {
        const today = utcToday()

        return categoriesModel.getAmounts(this.endOfMonth <= today ? this.endOfMonth : today).get(this.category.name) ?? 0
    }

    get monthAmount (): number {
        return this.endAmount - this.startAmount
    }

    get monthlyAverage (): number {
        const today = utcToday()
        const yearAgo = today.minus({ year: 1 })
        const firstOp = operationsModel.operations.find(op => (op.type === 'expense' || op.type === 'income') && op.categories.find(c => c.name === this.category.name) !== undefined) as NotDeletedOperation | undefined
        if (firstOp === undefined) {
            return 0
        }
        const firstOpMonth = firstOp.date.set({ day: 1 }).minus({ day: 1 })

        const startDay = yearAgo < firstOpMonth ? firstOpMonth : yearAgo

        return (
            (categoriesModel.getAmounts(today).get(this.category.name) ?? 0) -
            (categoriesModel.getAmounts(startDay).get(this.category.name) ?? 0)
        ) / today.diff(startDay, 'years').years / 12
    }

    get last30Days (): number {
        const today = utcToday()
        const startDay = today.minus({ day: 30 })
        return (categoriesModel.getAmounts(today).get(this.category.name) ?? 0) -
        (categoriesModel.getAmounts(startDay).get(this.category.name) ?? 0)
    }

    get monthlyGoal (): number | null {
        if (this.category.yearGoal === undefined) return null

        return (this.category.yearGoal) / 12
    }

    get allDays (): DateTime[] {
        if (this._allDays === null) {
            this._allDays = []
            for (let d = this.startOfMonth; d <= this.endOfMonth; d = d.plus({ day: 1 })) {
                this._allDays.push(d)
            }
        }

        return this._allDays
    }

    get amounts (): Array<number | undefined> {
        if (this._amountsByDay === null) {
            const today = utcToday()
            this._amountsByDay = this.allDays.map((d, index, arr) => {
                if (index === 0) {
                    return 0
                }

                if (d > today) {
                    return undefined
                }

                return (categoriesModel.getAmounts(d).get(this.category.name) ?? 0) -
                (categoriesModel.getAmounts(arr[index - 1]).get(this.category.name) ?? 0)
            })
        }

        return this._amountsByDay
    }

    get amountsSum (): Array<number | undefined> {
        if (this._amountsByDayFromZero === null) {
            let sum = 0

            this._amountsByDayFromZero = this.amounts.map(a => {
                if (a === undefined) return undefined
                sum += a
                return sum
            })
        }

        return this._amountsByDayFromZero
    }

    static for (cat: Category | string, date?: DateTime): CatMonthStats {
        if (typeof cat === 'string') {
            cat = categoriesModel.get(cat)
        }

        return new CatMonthStats(cat, date ?? appState.startDate)
    }
}
