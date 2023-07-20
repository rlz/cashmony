import { match, P } from 'ts-pattern'

import { type Filter } from './filter'
import { type NotDeletedOperation } from './model'

export interface AnyPredicate {
    readonly type: 'any'
}

export interface TypePredicate {
    readonly type: 'type'
    readonly opType: 'expense' | 'income' | 'transfer' | 'adjustment'
}

export interface CategoryPredicate {
    readonly type: 'cat'
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
    readonly name: string
}

export interface TagPredicate {
    readonly type: 'tag'
    readonly tag: string
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
    AnyPredicate | TypePredicate | CategoryPredicate | CommentPredicate |
    UncategorizedPredicate | AccountPredicate | TagPredicate |
    AndPredicate | OrPredicate | NotPredicate

export function compilePredicate (predicate: Predicate): (op: NotDeletedOperation) => boolean {
    return match<Predicate, (op: NotDeletedOperation) => boolean>(predicate)
        .with({ type: 'type' }, p => {
            return op => op.type === p.opType
        })
        .with({ type: 'and', predicates: [] }, () => {
            throw Error('and predicate must not be empty')
        })
        .with({ type: 'and', predicates: [P._] }, p => {
            return compilePredicate(p.predicates[0])
        })
        .with({ type: 'and', predicates: [P._, P._, ...P.array()] }, p => {
            const compiledPredicates = p.predicates.map(i => compilePredicate(i))
            return op => compiledPredicates.every(i => i(op))
        })
        .with({ type: 'or', predicates: [] }, () => {
            throw Error('or predicate must not be empty')
        })
        .with({ type: 'or', predicates: [P._] }, p => {
            return compilePredicate(p.predicates[0])
        })
        .with({ type: 'or', predicates: [P._, P._, ...P.array()] }, p => {
            const compiledPredicates = p.predicates.map(i => compilePredicate(i))
            return op => compiledPredicates.some(i => i(op))
        })
        .with({ type: 'not' }, p => {
            const predicate = compilePredicate(p.predicate)
            return op => !predicate(op)
        })
        .with({ type: 'cat' }, p => {
            return op => (op.type === 'expense' || op.type === 'income') && op.categories.some(i => i.name === p.name)
        })
        .with({ type: 'comment' }, p => {
            return op => op.comment?.includes(p.search) === true
        })
        .with({ type: 'uncategorized' }, p => {
            return op => (op.type === 'expense' || op.type === 'income') && op.categories.length === 0
        })
        .with({ type: 'account' }, p => {
            return op => op.account.name === p.name || (op.type === 'transfer' && op.toAccount.name === p.name)
        })
        .with({ type: 'tag' }, p => {
            return op => op.tags.includes(p.tag)
        })
        .with({ type: 'any' }, () => {
            return op => true
        })
        .otherwise(() => {
            throw Error('not implemented')
        })
}

export const PE = {
    type: (opType: 'expense' | 'income' | 'transfer' | 'adjustment'): TypePredicate => {
        return {
            type: 'type',
            opType
        }
    },

    cat: (name: string): CategoryPredicate => {
        return {
            type: 'cat',
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

    account: (name: string): AccountPredicate => {
        return {
            type: 'account',
            name
        }
    },

    tag: (tag: string): TagPredicate => {
        return {
            type: 'tag',
            tag
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

        if (filter.opTypeMode === 'selected') {
            predicates.push(PE.or(...filter.opType.map(i => PE.type(i))))
        } else if (filter.opTypeMode === 'exclude') {
            predicates.push(PE.not(PE.or(...filter.opType.map(i => PE.type(i)))))
        }

        if (filter.accountsMode === 'selected') {
            predicates.push(PE.or(...filter.accounts.map(i => PE.account(i))))
        } else if (filter.accountsMode === 'exclude') {
            predicates.push(PE.not(PE.or(...filter.accounts.map(i => PE.account(i)))))
        }

        if (filter.categoriesMode === 'selected') {
            console.log(filter.categories)
            predicates.push(
                PE.or(
                    PE.type('adjustment'),
                    PE.type('transfer'),
                    ...filter.categories.map(i => i === '' ? PE.uncat() : PE.cat(i))
                )
            )
        } else if (filter.categoriesMode === 'exclude') {
            predicates.push(
                PE.or(
                    PE.type('adjustment'),
                    PE.type('transfer'),
                    PE.not(PE.or(...filter.categories.map(i => i === '' ? PE.uncat() : PE.cat(i))))
                )
            )
        }

        if (filter.tagsMode === 'selected') {
            predicates.push(PE.or(...filter.tags.map(i => PE.tag(i))))
        } else if (filter.tagsMode === 'exclude') {
            predicates.push(PE.not(PE.or(...filter.tags.map(i => PE.tag(i)))))
        }

        return predicates.length === 0 ? PE.any() : PE.and(...predicates)
    }
}

export function expensesGoalPredicate (filter: Filter): Predicate {
    return PE.and(PE.or(PE.type('expense'), PE.and(PE.type('income'), PE.not(PE.uncat()))), PE.filter(filter))
}
