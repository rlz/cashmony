import { type DurationLikeObject, type DateTime } from 'luxon'
import { CategoriesModel } from './categories'
import { type NotDeletedOperation, type Category, type IncomeOperation, type ExpenseOperation, type TransferOperation, type AdjustmentOperation } from './model'
import { LastPeriodTimeSpan, type HumanTimeSpan } from '../helpers/dates'
import { OperationsModel } from './operations'
import { AppState } from './appState'

const appState = AppState.instance()
const categoriesModel = CategoriesModel.instance()
const operationsModel = OperationsModel.instance()

export class Operations<T extends IncomeOperation | ExpenseOperation | TransferOperation | AdjustmentOperation> {
    private readonly predicate: (op: NotDeletedOperation) => boolean

    private constructor (predicate: (op: NotDeletedOperation) => boolean) {
        this.predicate = predicate
    }

    static all (): Operations<IncomeOperation | ExpenseOperation | TransferOperation | AdjustmentOperation> {
        return new Operations(() => true)
    }

    forTimeSpan (timeSpan: HumanTimeSpan): Operations<T> {
        const startDate = timeSpan.startDate
        const endDate = timeSpan.endDate

        return new Operations((op) => this.predicate(op) && op.date >= startDate && op.date <= endDate)
    }

    forAccounts (...accounts: string[]): Operations<T> {
        const accountsSet = new Set(accounts)
        return new Operations(op => this.predicate(op) && accountsSet.has(op.account.name))
    }

    forCategories (...categories: string[]): Operations<Exclude<T, TransferOperation | AdjustmentOperation>> {
        const categoriesSet = new Set(categories)
        return new Operations(
            op => this.predicate(op) &&
                (op.type === 'expense' || op.type === 'income') &&
                op.categories.some(cat => categoriesSet.has(cat.name))
        )
    }

    * operations (opts?: { reverse?: boolean }): Generator<T> {
        const ops = opts?.reverse === true
            ? [...operationsModel.operations].reverse()
            : operationsModel.operations

        for (const op of ops) {
            if (op.type === 'deleted') continue

            if (this.predicate(op)) {
                yield op as T
            }
        }
    }

    sumCategoryAmount (catName: string): number {
        let sum = 0
        for (const op of this.forCategories(catName).operations()) {
            for (const cat of op.categories) {
                if (cat.name === catName) {
                    sum += cat.amount
                }
            }
        }
        return sum
    }

    * groupByDate (opts?: { reverse?: boolean }): Generator<T[]> {
        let operations: T[] = []
        let currentMillis: number | null = null

        for (const op of this.operations({ reverse: opts?.reverse })) {
            const opMillis = op.date.toMillis()

            if (currentMillis === null) {
                currentMillis = opMillis
            }

            if (opMillis !== currentMillis) {
                yield operations
                operations = []
                currentMillis = opMillis
            }

            operations.push(op)
        }

        if (operations.length > 0) {
            yield operations
        }
    }
}

export class CategoryStats {
    category: Category

    constructor (category: Category) {
        this.category = category
    }

    amountTotal (timeSpan?: HumanTimeSpan): number {
        timeSpan = timeSpan ?? appState.timeSpan
        return Operations.all().forTimeSpan(timeSpan).sumCategoryAmount(this.category.name)
    }

    avgUntilToday (days: number, timeSpan?: HumanTimeSpan): number {
        timeSpan = timeSpan ?? appState.timeSpan

        const today = appState.today
        const endDate = timeSpan.endDate < today ? timeSpan.endDate : today

        const timeSpanDays = endDate.diff(timeSpan.startDate, 'days').days + 1

        return this.amountTotal(timeSpan) * days / timeSpanDays
    }

    goal (days: number): number | null {
        if (this.category.yearGoal === undefined) return null
        return this.category.yearGoal * days / appState.today.daysInYear
    }

    leftPerDay (): number | null {
        const total = this.amountTotal()
        const goal = this.goal(this.daysTotal())
        if (goal === null) return null
        return (goal - total) / this.daysLeft()
    }

    daysLeft (): number {
        const timeSpan = appState.timeSpan
        const today = appState.today
        if (timeSpan.endDate < today) return 0

        return timeSpan.endDate.diff(today, 'days').days
    }

    daysTotal (): number {
        return appState.timeSpan.totalDays
    }

    durationAvg (days: number, duration: DurationLikeObject): number {
        return this.avgUntilToday(days, new LastPeriodTimeSpan(duration))
    }

    * totalAmountByDates (): Generator<number | undefined> {
        let cumAmount = 0
        for (const amount of this.amountByDate()) {
            if (amount === undefined) {
                yield undefined
                continue
            }

            cumAmount += amount
            yield cumAmount
        }
    }

    * amountByDate (): Generator<number | undefined> {
        const ops = [...Operations
            .all()
            .forTimeSpan(appState.timeSpan)
            .forCategories(this.category.name)
            .operations()
        ]

        const today = appState.today

        if (ops.length === 0) {
            return [...appState.timeSpan.allDates()].map(() => 0)
        }

        let opIndex = 0
        for (const date of appState.timeSpan.allDates()) {
            if (date > today) {
                yield undefined
                continue
            }

            if (opIndex === ops.length) {
                yield 0
                continue
            }

            if (ops[opIndex].date > date) {
                yield 0
                continue
            }

            let amount = 0
            while (opIndex < ops.length && ops[opIndex].date <= date) {
                for (const c of ops[opIndex].categories) {
                    if (c.name === this.category.name) {
                        amount += c.amount
                    }
                }
                opIndex += 1
            }
            yield amount
        }
    }

    static for (cat: Category | string, date?: DateTime): CategoryStats {
        if (typeof cat === 'string') {
            cat = categoriesModel.get(cat)
        }

        return new CategoryStats(cat)
    }
}
