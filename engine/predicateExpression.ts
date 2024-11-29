import escapeStringRegexp from 'escape-string-regexp'
import { match, P } from 'ts-pattern'

import { Engine } from './engine'
import { Filter, NotDeletedOperation } from './model'

export type ComparisonOperator = '<' | '>' | '=' | '<=' | '>=' | '!='

export interface AnyPredicate {
    readonly type: 'any'
}

export interface TypePredicate {
    readonly type: 'type'
    readonly opType: 'expense' | 'income' | 'transfer' | 'adjustment'
}

export interface CategoryPredicate {
    readonly type: 'cat'
    readonly id: string
}

export interface CategoryNamePredicate {
    readonly type: 'catName'
    readonly name: string
}

export interface CommentPredicate {
    readonly type: 'comment'
    readonly search: string
}

export interface UncategorizedPredicate {
    readonly type: 'uncategorized'
}

export interface AccountPredicate {
    readonly type: 'account'
    readonly id: string
}

export interface AccountNamePredicate {
    readonly type: 'accountName'
    readonly name: string
}

export interface TagPredicate {
    readonly type: 'tag'
    readonly tag: string
}

export interface CurrencyPredicate {
    readonly type: 'currency'
    readonly currency: string
}

export interface AmountPredicate {
    readonly type: 'amount'
    readonly op: ComparisonOperator
    readonly value: number
}

export interface AndPredicate {
    readonly type: 'and'
    readonly predicates: readonly Predicate[]
}

export interface OrPredicate {
    readonly type: 'or'
    readonly predicates: readonly Predicate[]
}

export interface NotPredicate {
    readonly type: 'not'
    readonly predicate: Predicate
}

export type Predicate =
    AnyPredicate | TypePredicate | CategoryPredicate | CategoryNamePredicate |
    CommentPredicate | UncategorizedPredicate | AccountPredicate |
    AccountNamePredicate | TagPredicate | CurrencyPredicate | AmountPredicate |
    AndPredicate | OrPredicate | NotPredicate

export function compilePredicate(predicate: Predicate, engine: Engine): (op: NotDeletedOperation) => boolean {
    return match<Predicate, (op: NotDeletedOperation) => boolean>(predicate)
        .with({ type: 'type' }, (p) => {
            return op => op.type === p.opType
        })
        .with({ type: 'and', predicates: [] }, () => {
            throw Error('and predicate must not be empty')
        })
        .with({ type: 'and', predicates: [P._] }, (p) => {
            return compilePredicate(p.predicates[0], engine)
        })
        .with({ type: 'and', predicates: [P._, P._, ...P.array()] }, (p) => {
            const compiledPredicates = p.predicates.map(i => compilePredicate(i, engine))
            return op => compiledPredicates.every(i => i(op))
        })
        .with({ type: 'or', predicates: [] }, () => {
            throw Error('or predicate must not be empty')
        })
        .with({ type: 'or', predicates: [P._] }, (p) => {
            return compilePredicate(p.predicates[0], engine)
        })
        .with({ type: 'or', predicates: [P._, P._, ...P.array()] }, (p) => {
            const compiledPredicates = p.predicates.map(i => compilePredicate(i, engine))
            return op => compiledPredicates.some(i => i(op))
        })
        .with({ type: 'not' }, (p) => {
            const predicate = compilePredicate(p.predicate, engine)
            return op => !predicate(op)
        })
        .with({ type: 'cat' }, (p) => {
            return op => (op.type === 'expense' || op.type === 'income') && op.categories.some(i => i.id === p.id)
        })
        .with({ type: 'catName' }, (p) => {
            const catId = engine.getCategoryByName(p.name).id
            return compilePredicate(PE.cat(catId), engine)
        })
        .with({ type: 'comment' }, (p) => {
            const re = new RegExp(escapeStringRegexp(p.search), 'i')
            return op => re.test(op.comment ?? '')
        })
        .with({ type: 'uncategorized' }, (_p) => {
            return op => (op.type === 'expense' || op.type === 'income') && op.categories.length === 0
        })
        .with({ type: 'account' }, (p) => {
            return op => op.account.id === p.id || (op.type === 'transfer' && op.toAccount.id === p.id)
        })
        .with({ type: 'accountName' }, (p) => {
            const accId = engine.getAccountByName(p.name).id
            return compilePredicate(PE.account(accId), engine)
        })
        .with({ type: 'tag' }, (p) => {
            return op => op.tags.includes(p.tag)
        })
        .with({ type: 'currency' }, (p) => {
            return op => op.currency === p.currency
        })
        .with({ type: 'amount', op: '=' }, (p) => {
            return op => Math.abs(op.amount) === p.value
        })
        .with({ type: 'amount', op: '!=' }, (p) => {
            return op => Math.abs(op.amount) !== p.value
        })
        .with({ type: 'amount', op: '<' }, (p) => {
            return op => Math.abs(op.amount) < p.value
        })
        .with({ type: 'amount', op: '>' }, (p) => {
            return op => Math.abs(op.amount) > p.value
        })
        .with({ type: 'amount', op: '<=' }, (p) => {
            return op => Math.abs(op.amount) <= p.value
        })
        .with({ type: 'amount', op: '>=' }, (p) => {
            return op => Math.abs(op.amount) >= p.value
        })
        .with({ type: 'any' }, () => {
            return _op => true
        })
        .otherwise((p) => {
            throw Error(`Not implemented predicate: ${JSON.stringify(p)}`)
        })
}

export const PE = {
    type: (opType: 'expense' | 'income' | 'transfer' | 'adjustment'): TypePredicate => {
        return {
            type: 'type',
            opType
        }
    },

    cat: (id: string): CategoryPredicate => {
        return {
            type: 'cat',
            id
        }
    },

    catName: (name: string): CategoryNamePredicate => {
        return {
            type: 'catName',
            name
        }
    },

    uncat: (): UncategorizedPredicate => {
        return {
            type: 'uncategorized'
        }
    },

    comment: (search: string): CommentPredicate => {
        return {
            type: 'comment',
            search
        }
    },

    account: (id: string): AccountPredicate => {
        return {
            type: 'account',
            id
        }
    },

    accountName: (name: string): AccountNamePredicate => {
        return {
            type: 'accountName',
            name
        }
    },

    tag: (tag: string): TagPredicate => {
        return {
            type: 'tag',
            tag
        }
    },

    currency: (currency: string): CurrencyPredicate => {
        return {
            type: 'currency',
            currency
        }
    },

    amount: (op: ComparisonOperator, value: number): AmountPredicate => {
        return {
            type: 'amount',
            op,
            value
        }
    },

    and: (...predicates: Predicate[]): AndPredicate => {
        return {
            type: 'and',
            predicates
        }
    },

    or: (...predicates: Predicate[]): OrPredicate => {
        return {
            type: 'or',
            predicates
        }
    },

    not: (predicate: Predicate): NotPredicate => {
        return {
            type: 'not',
            predicate
        }
    },

    any: (): AnyPredicate => {
        return {
            type: 'any'
        }
    },

    filter: (filter: Filter): Predicate => {
        const predicates: Predicate[] = []

        if (filter.search !== null) {
            predicates.push(PE.comment(filter.search))
        }

        if (filter.opTypeMode === 'selected' && filter.opType.length > 0) {
            predicates.push(PE.or(...filter.opType.map(i => PE.type(i))))
        } else if (filter.opTypeMode === 'exclude' && filter.opType.length > 0) {
            predicates.push(PE.not(PE.or(...filter.opType.map(i => PE.type(i)))))
        }

        if (filter.accountsMode === 'selected' && filter.accounts.length > 0) {
            predicates.push(PE.or(...filter.accounts.map(i => PE.account(i))))
        } else if (filter.accountsMode === 'exclude' && filter.accounts.length > 0) {
            predicates.push(PE.not(PE.or(...filter.accounts.map(i => PE.account(i)))))
        }

        if (filter.categoriesMode === 'selected' && filter.categories.length > 0) {
            predicates.push(
                PE.or(
                    PE.type('adjustment'),
                    PE.type('transfer'),
                    ...filter.categories.map(i => i === '' ? PE.uncat() : PE.cat(i))
                )
            )
        } else if (filter.categoriesMode === 'exclude' && filter.categories.length > 0) {
            predicates.push(
                PE.or(
                    PE.type('adjustment'),
                    PE.type('transfer'),
                    PE.not(PE.or(...filter.categories.map(i => i === '' ? PE.uncat() : PE.cat(i))))
                )
            )
        }

        if (filter.tagsMode === 'selected' && filter.tags.length > 0) {
            predicates.push(PE.or(...filter.tags.map(i => PE.tag(i))))
        } else if (filter.tagsMode === 'exclude' && filter.tags.length > 0) {
            predicates.push(PE.not(PE.or(...filter.tags.map(i => PE.tag(i)))))
        }

        return predicates.length === 0 ? PE.any() : PE.and(...predicates)
    }
}

export const EXPENSE_PREDICATE = PE.or(PE.type('expense'), PE.and(PE.type('income'), PE.not(PE.uncat())))

export const isExpense = compilePredicate(EXPENSE_PREDICATE, undefined!)

export const INCOME_PREDICATE = PE.and(PE.type('income'), PE.uncat())

export const isIncome = compilePredicate(INCOME_PREDICATE, undefined!)

export function expensesGoalPredicate(filter: Filter): Predicate {
    return PE.and(EXPENSE_PREDICATE, PE.filter(filter))
}
