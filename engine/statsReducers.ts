import { type DateTime } from 'luxon'

import { CurrenciesLoader } from '../currencies/currencies'
import { Engine } from './engine'
import { compilePredicate, type Predicate } from './predicateExpression'
import { type IntervalType, type Reducer } from './stats'

export function perIntervalExpensesReducer(engine: Engine, currenciesLoader: CurrenciesLoader, interval: IntervalType, predicate: Predicate, currency: string): Reducer<number> {
    const filter = compilePredicate(predicate, engine)

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

            const rate = await currenciesLoader.getRate(op.date, op.currency, currency)

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

export function cumulativeIntervalExpensesReducer(engine: Engine, currenciesLoader: CurrenciesLoader, interval: IntervalType, predicate: Predicate, currency: string): Reducer<number> {
    const filter = compilePredicate(predicate, engine)

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

            const rate = await currenciesLoader.getRate(op.date, op.currency, currency)

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

export function periodExpensesReducer(engine: Engine, currenciesLoader: CurrenciesLoader, from: DateTime | null, predicate: Predicate, currency: string): Reducer<number> {
    const fromMillis = from?.toMillis() ?? 0
    const filter = compilePredicate(predicate, engine)

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

            const rate = await currenciesLoader.getRate(op.date, op.currency, currency)

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
