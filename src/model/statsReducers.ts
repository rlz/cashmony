import { type DateTime } from 'luxon'

import { AppState } from './appState'
import { CategoriesModel } from './categories'
import { CurrenciesModel } from './currencies'
import { type NotDeletedOperation } from './model'
import { compilePredicate, type Predicate } from './predicateExpression'
import { type IntervalType, type Reducer } from './stats'

const appState = AppState.instance()
const currenciesModel = CurrenciesModel.instance()
const categoriesModel = CategoriesModel.instance()

export function countOpsReducer (interval: IntervalType): Reducer<number> {
    return {
        interval,
        async reduce (op, _interval, firstOp, _intervalKind, values: number[]) {
            if (firstOp) {
                values.push(0)
            }
            if (op !== null) {
                values[values.length - 1] += 1
            }
        }
    }
}

export function sumCatExpensesReducer (interval: IntervalType, totalCurrency: string, uncatCurrency: string): Reducer<Record<string, number>> {
    const zero: Record<string, number> = {
        _total: 0,
        _: 0
    };

    (categoriesModel.categories ?? new Map()).forEach(i => { if (i.deleted !== true) zero[i.name] = 0 })

    return {
        interval,
        async reduce (op, _interval, firstOp, _intervalKind, values: Array<Record<string, number>>) {
            if (firstOp) {
                values.push({ ...zero })
            }

            if (op === null || (op.type !== 'expense' && !(op.type === 'income' && op.categories.length > 0))) {
                return
            }

            const amounts = values[values.length - 1]

            const totalRate = await currenciesModel.getRate(op.date, op.currency, totalCurrency)

            if (op.categories.length === 0) {
                const uncatRate = await currenciesModel.getRate(op.date, op.currency, uncatCurrency)
                amounts._ += op.amount * uncatRate
                amounts._total += op.amount * totalRate
            }

            for (const cat of op.categories) {
                const rate = await currenciesModel.getRate(op.date, op.currency, categoriesModel.get(cat.name).currency ?? appState.masterCurrency)
                amounts[cat.name] += cat.amount * rate
                amounts._total += cat.amount * totalRate
            }
        }
    }
}

export function opsPerIterval (interval: IntervalType, keepEmpty: boolean): Reducer<NotDeletedOperation[]> {
    return {
        interval,
        reduce: async (op, _interval, firstOp, _intervalKind, values) => {
            if (firstOp && (op !== null || keepEmpty)) {
                values.push([])
            }

            if (op !== null) {
                values[values.length - 1].push(op)
            }
        }
    }
}

export function perCatTodayExpensesReducer (totalCurrency: string, uncatCurrency: string): Reducer<Record<string, number>> {
    const appState = AppState.instance()
    const categoriesModel = CategoriesModel.instance()
    const currenciesModel = CurrenciesModel.instance()

    const zero: Record<string, number> = {
        _total: 0,
        _: 0
    };

    (categoriesModel.categories ?? new Map()).forEach(i => { if (i.deleted !== true) zero[i.name] = 0 })

    return {
        interval: 'day',
        async reduce (op, _interval, firstOp, intervalKind, values: Array<Record<string, number>>) {
            if (values.length === 0) {
                values.push({ ...zero })
            }

            if (intervalKind !== 'now' || op === null || (op.type !== 'expense' && !(op.type === 'income' && op.categories.length > 0))) {
                return
            }

            const totalRate = await currenciesModel.getRate(op.date, op.currency, totalCurrency)
            values[0]._total += op.amount * totalRate

            if (op.categories.length === 0) {
                const uncatRate = await currenciesModel.getRate(op.date, op.currency, uncatCurrency)
                values[0]._ += op.amount * uncatRate
            }

            for (const cat of op.categories) {
                const rate = await currenciesModel.getRate(op.date, op.currency, categoriesModel.get(cat.name).currency ?? appState.masterCurrency)
                values[0][cat.name] += cat.amount * rate
            }
        }
    }
}

export interface PredicateWithCurrency {
    currency: string
    predicate: Predicate
}

interface FilterWithCurrency {
    currency: string
    filter: (op: NotDeletedOperation) => boolean
}

export function perPredicatePerIntervalSumExpenses (interval: IntervalType, predicates: Record<string, PredicateWithCurrency>): Reducer<Record<string, number>> {
    const zero: Record<string, number> = {}

    Object.keys(predicates).forEach(k => { zero[k] = 0 })

    const filters: Record<string, FilterWithCurrency> = {}

    Object.entries(predicates).forEach(([k, p]) => {
        filters[k] = { currency: p.currency, filter: compilePredicate(p.predicate) }
    })

    return {
        interval,
        async reduce (op, _interval, firstOp, intervalKind, values: Array<Record<string, number>>) {
            if (firstOp) {
                values.push({ ...zero })
            }

            if (op === null || (op.type !== 'expense' && !(op.type === 'income' && op.categories.length > 0))) {
                return
            }

            for (const [key, filterWithCurrency] of Object.entries(filters)) {
                if (!filterWithCurrency.filter(op)) {
                    continue
                }

                const rate = await currenciesModel.getRate(op.date, op.currency, filterWithCurrency.currency)

                if (op.categories.length === 0) {
                    values[values.length - 1][key] += op.amount * rate
                    continue
                }

                for (const cat of op.categories) {
                    const catOp = { ...op, categories: [cat] }

                    if (!filterWithCurrency.filter(catOp)) {
                        continue
                    }

                    values[values.length - 1][key] += cat.amount * rate
                }
            }
        }
    }
}

export function perPredicateTodaySumExpenses (predicates: Record<string, PredicateWithCurrency>): Reducer<Record<string, number>> {
    const zero: Record<string, number> = {}

    Object.keys(predicates).forEach(k => { zero[k] = 0 })

    const filters: Record<string, FilterWithCurrency> = {}

    Object.entries(predicates).forEach(([k, p]) => { filters[k] = { currency: p.currency, filter: compilePredicate(p.predicate) } })

    return {
        interval: 'day',
        async reduce (op, _interval, firstOp, intervalKind, values: Array<Record<string, number>>) {
            if (values.length === 0) {
                values.push({ ...zero })
            }

            if (intervalKind !== 'now' || op === null || (op.type !== 'expense' && !(op.type === 'income' && op.categories.length > 0))) {
                return
            }

            for (const [key, filterWithCurrency] of Object.entries(filters)) {
                if (!filterWithCurrency.filter(op)) {
                    return
                }

                const rate = await currenciesModel.getRate(op.date, op.currency, filterWithCurrency.currency)

                if (op.categories.length === 0) {
                    values[values.length - 1][key] += op.amount * rate
                    continue
                }

                for (const cat of op.categories) {
                    const catOp = { ...op, categories: [cat] }

                    if (!filterWithCurrency.filter(catOp)) {
                        continue
                    }

                    values[values.length - 1][key] += cat.amount * rate
                }
            }
        }
    }
}

export function perIntervalExpensesReducer (interval: IntervalType, predicate: Predicate, currency: string): Reducer<number> {
    const currenciesModel = CurrenciesModel.instance()
    const filter = compilePredicate(predicate)

    return {
        interval,
        reduce: async (op, _interval, firstOp, _intervalKind, result) => {
            if (firstOp) {
                result.push(0)
            }

            if (
                op === null ||
                (
                    op.type !== 'expense' &&
                    (op.type !== 'income' || op.categories.length === 0)
                )
            ) {
                return
            }

            const rate = await currenciesModel.getRate(op.date, op.currency, currency)

            for (const cat of op.categories) {
                const catOp = { ...op, categories: [cat] }

                if (!filter(catOp)) {
                    continue
                }

                result[result.length - 1] += cat.amount * rate
            }
        }
    }
}

export function cumulativeIntervalExpensesReducer (interval: IntervalType, predicate: Predicate, currency: string): Reducer<number> {
    const currenciesModel = CurrenciesModel.instance()
    const filter = compilePredicate(predicate)

    return {
        interval,
        reduce: async (op, _interval, firstOp, _intervalKind, result) => {
            if (firstOp) {
                if (result.length === 0) {
                    result.push(0)
                } else {
                    result.push(result[result.length - 1])
                }
            }

            if (
                op === null ||
                (
                    op.type !== 'expense' &&
                    (op.type !== 'income' || op.categories.length === 0)
                )
            ) {
                return
            }

            const rate = await currenciesModel.getRate(op.date, op.currency, currency)

            for (const cat of op.categories) {
                const catOp = { ...op, categories: [cat] }

                if (!filter(catOp)) {
                    continue
                }

                result[result.length - 1] += cat.amount * rate
            }
        }
    }
}

export function periodExpensesReducer (from: DateTime | null, predicate: Predicate, currency: string): Reducer<number> {
    const fromMillis = from?.toMillis() ?? 0
    const currenciesModel = CurrenciesModel.instance()
    const filter = compilePredicate(predicate)

    return {
        interval: null,
        reduce: async (op, _interval, _firstOp, _intervalKind, result) => {
            if (result.length === 0) {
                result.push(0)
            }

            if (
                op === null ||
                (
                    op.type !== 'expense' &&
                    (op.type !== 'income' || op.categories.length === 0)
                ) ||
                op.date.toMillis() < fromMillis
            ) {
                return
            }

            const rate = await currenciesModel.getRate(op.date, op.currency, currency)

            for (const cat of op.categories) {
                const catOp = { ...op, categories: [cat] }

                if (!filter(catOp)) {
                    continue
                }

                result[result.length - 1] += cat.amount * rate
            }
        }
    }
}
