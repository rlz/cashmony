import { generate } from 'astring'
import { type BinaryExpression, type Expression, type Identifier, type Literal, type LogicalExpression, type MemberExpression, type ReturnStatement } from 'estree'
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

function astIdentifier (name: string): Identifier {
    return { type: 'Identifier', name }
}

function astOpMember (member: string): MemberExpression {
    return {
        type: 'MemberExpression',
        object: astIdentifier('op'),
        property: astIdentifier(member),
        computed: false,
        optional: false
    }
}

function astLiteral (value: null | boolean | number | string): Literal {
    return { type: 'Literal', value }
}

function astEq (left: Expression, right: Expression): BinaryExpression {
    return {
        type: 'BinaryExpression',
        operator: '===',
        left,
        right
    }
}

function astOr (left: Expression, right: Expression): LogicalExpression {
    return {
        type: 'LogicalExpression',
        operator: '||',
        left,
        right
    }
}

function astAnd (left: Expression, right: Expression): LogicalExpression {
    return {
        type: 'LogicalExpression',
        operator: '&&',
        left,
        right
    }
}

function predicateToEstree (predicate: Predicate): Expression {
    return match(predicate)
        .with({ type: 'type' }, (p): Expression => {
            return astEq(astOpMember('type'), astLiteral(p.opType))
        })
        .with({ type: 'and', predicates: [] }, (): Expression => {
            throw Error('and predicate must not be empty')
        })
        .with({ type: 'and', predicates: [P._] }, (p): Expression => {
            return predicateToEstree(p.predicates[0])
        })
        .with({ type: 'and', predicates: [P._, P._, ...P.array()] }, (p): Expression => {
            let result = astAnd(
                predicateToEstree(p.predicates[0]),
                predicateToEstree(p.predicates[1])
            )
            for (let i = 2; i < p.predicates.length; ++i) {
                result = astAnd(result, predicateToEstree(p.predicates[i]))
            }
            return result
        })
        .with({ type: 'or', predicates: [] }, (): Expression => {
            throw Error('or predicate must not be empty')
        })
        .with({ type: 'or', predicates: [P._] }, (p): Expression => {
            return predicateToEstree(p.predicates[0])
        })
        .with({ type: 'or', predicates: [P._, P._, ...P.array()] }, (p): Expression => {
            let result = astOr(
                predicateToEstree(p.predicates[0]),
                predicateToEstree(p.predicates[1])
            )
            for (let i = 2; i < p.predicates.length; ++i) {
                result = astOr(result, predicateToEstree(p.predicates[i]))
            }
            return result
        })
        .with({ type: 'not' }, (p): Expression => {
            return {
                type: 'UnaryExpression',
                operator: '!',
                prefix: true,
                argument: predicateToEstree(p.predicate)
            }
        })
        .with({ type: 'cat' }, (p): Expression => {
            return astAnd(
                astOr(
                    astEq(astOpMember('type'), astLiteral('expense')),
                    astEq(astOpMember('type'), astLiteral('income'))
                ),
                {
                    type: 'CallExpression',
                    callee: {
                        type: 'MemberExpression',
                        object: astOpMember('categories'),
                        property: astIdentifier('some'),
                        computed: false,
                        optional: false
                    },
                    arguments: [
                        {
                            type: 'ArrowFunctionExpression',
                            expression: true,
                            params: [astIdentifier('i')],
                            body: astEq(
                                {
                                    type: 'MemberExpression',
                                    object: astIdentifier('i'),
                                    property: astIdentifier('name'),
                                    computed: false,
                                    optional: false
                                },
                                astLiteral(p.name)
                            )
                        }
                    ],
                    optional: false
                }
            )
        })
        .with({ type: 'comment' }, (p): Expression => {
            return {
                type: 'BinaryExpression',
                operator: '>=',
                left: {
                    type: 'ChainExpression',
                    expression: {
                        type: 'CallExpression',
                        arguments: [astLiteral(p.search)],
                        callee: {
                            type: 'MemberExpression',
                            object: astOpMember('comment'),
                            property: astIdentifier('indexOf'),
                            computed: false,
                            optional: true
                        },
                        optional: false
                    }
                },
                right: astLiteral(0)
            }
        })
        .with({ type: 'uncategorized' }, (p): Expression => {
            return astAnd(
                astOr(
                    astEq(astOpMember('type'), astLiteral('expense')),
                    astEq(astOpMember('type'), astLiteral('income'))
                ),
                astEq(
                    {
                        type: 'MemberExpression',
                        object: astOpMember('categories'),
                        property: astIdentifier('length'),
                        computed: false,
                        optional: false
                    },
                    astLiteral(0)
                )
            )
        })
        .with({ type: 'account' }, (p): Expression => {
            return astOr(
                astEq(
                    {
                        type: 'MemberExpression',
                        object: astOpMember('account'),
                        property: astIdentifier('name'),
                        computed: false,
                        optional: false
                    },
                    astLiteral(p.name)
                ),
                astAnd(
                    astEq(
                        astOpMember('type'),
                        astLiteral('transfer')
                    ),
                    astEq(
                        {
                            type: 'MemberExpression',
                            object: astOpMember('toAccount'),
                            property: astIdentifier('name'),
                            computed: false,
                            optional: false
                        },
                        astLiteral(p.name)
                    )
                )
            )
        })
        .with({ type: 'tag' }, (p): Expression => {
            return {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    object: astOpMember('tags'),
                    property: astIdentifier('includes'),
                    computed: false,
                    optional: false
                },
                arguments: [astLiteral(p.tag)],
                optional: false
            }
        })
        .with({ type: 'any' }, () => {
            return astLiteral(true)
        })
        .otherwise(() => {
            throw Error('not implemented')
        })
}

export function predicateToBodyStr (predicate: Predicate): string {
    const bodyAst: ReturnStatement = {
        type: 'ReturnStatement',
        argument: predicateToEstree(predicate)
    }

    return generate(bodyAst)
}

export function compilePredicate (predicate: Predicate): (op: NotDeletedOperation) => boolean {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    return new Function(
        'op',
        predicateToBodyStr(predicate)) as (op: NotDeletedOperation) => boolean
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
