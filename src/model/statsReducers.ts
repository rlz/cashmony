import { type DateTime } from 'luxon'

import { CurrenciesModel } from './currencies'
import { compilePredicate, type Predicate } from './predicateExpression'
import { type IntervalType, type Reducer } from './stats'

export function perIntervalExpensesReducer(interval: IntervalType, predicate: Predicate, currency: string): Reducer<number> {
    const currenciesModel = CurrenciesModel.instance()
    const filter = compilePredicate(predicate)

    return {
        interval,
        reduce: async (op, _interval, firstOp, _intervalKind, result) => {
            if (firstOp && op !== null) {
                result.push(0)
            }

            if (
                op === null
                || (
                    op.type !== 'expense'
                    && (op.type !== 'income' || op.categories.length === 0)
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

export function cumulativeIntervalExpensesReducer(interval: IntervalType, predicate: Predicate, currency: string): Reducer<number> {
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
                op === null
                || (
                    op.type !== 'expense'
                    && (op.type !== 'income' || op.categories.length === 0)
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

export function periodExpensesReducer(from: DateTime | null, predicate: Predicate, currency: string): Reducer<number> {
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
                op === null
                || (
                    op.type !== 'expense'
                    && (op.type !== 'income' || op.categories.length === 0)
                )
                || op.date.toMillis() < fromMillis
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
