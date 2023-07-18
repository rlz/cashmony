import 'regenerator-runtime/runtime'

import { DateTime } from 'luxon'

import { utcToday } from '../helpers/dates'
import { type ExpenseOperation, type IncomeOperation, type TransferOperation } from './model'
import { compilePredicate, PE } from './predicateExpression'

test('Any predicate', () => {
    const pe = compilePredicate(PE.any())
    const expense: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }
    const income: IncomeOperation = {
        id: '',
        type: 'income',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: 1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: 1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(pe(expense)).toBe(true)
    expect(pe(income)).toBe(true)
})

test('Type predicate', () => {
    const expPe = compilePredicate(PE.type('expense'))
    const incPe = compilePredicate(PE.type('income'))
    const expense: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }
    const income: IncomeOperation = {
        id: '',
        type: 'income',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: 1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: 1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(expPe(expense)).toBe(true)
    expect(expPe(income)).toBe(false)
    expect(incPe(expense)).toBe(false)
    expect(incPe(income)).toBe(true)
})

test('And predicate', () => {
    const expense: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }
    const income: IncomeOperation = {
        id: '',
        type: 'income',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: 1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: 1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }

    const singleAnd = compilePredicate(PE.and(PE.type('expense')))
    expect(singleAnd(expense)).toBe(true)
    expect(singleAnd(income)).toBe(false)

    const doubleAnd = compilePredicate(
        PE.and(
            PE.type('expense'),
            PE.tag('foo')
        )
    )
    expect(doubleAnd(expense)).toBe(true)
    expect(doubleAnd(income)).toBe(false)
    expect(doubleAnd({ ...expense, tags: ['foo'] })).toBe(true)
    expect(doubleAnd({ ...expense, tags: ['bar'] })).toBe(false)

    const tripleAnd = compilePredicate(
        PE.and(
            PE.type('expense'),
            PE.tag('foo'),
            PE.tag('bar')
        )
    )
    expect(tripleAnd(expense)).toBe(true)
    expect(tripleAnd(income)).toBe(false)
    expect(tripleAnd({ ...expense, tags: ['foo'] })).toBe(false)
    expect(tripleAnd({ ...expense, tags: ['bar'] })).toBe(false)
})

test('Or predicate', () => {
    const expense: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }
    const income: IncomeOperation = {
        id: '',
        type: 'income',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: 1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: 1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }

    const singleOr = compilePredicate(PE.or(PE.type('expense')))
    expect(singleOr(expense)).toBe(true)
    expect(singleOr(income)).toBe(false)

    const doubleOr = compilePredicate(
        PE.or(
            PE.type('expense'),
            PE.tag('foo')
        )
    )
    expect(doubleOr(expense)).toBe(true)
    expect(doubleOr(income)).toBe(true)
    expect(doubleOr({ ...income, tags: ['foo'] })).toBe(true)
    expect(doubleOr({ ...income, tags: ['bar'] })).toBe(false)

    const tripleOr = compilePredicate(
        PE.or(
            PE.type('expense'),
            PE.tag('foo'),
            PE.tag('bar')
        )
    )
    expect(tripleOr(expense)).toBe(true)
    expect(tripleOr(income)).toBe(true)
    expect(tripleOr({ ...expense, tags: [] })).toBe(true)
    expect(tripleOr({ ...expense, tags: ['foo'] })).toBe(true)
    expect(tripleOr({ ...expense, tags: ['bar'] })).toBe(true)
    expect(tripleOr({ ...income, tags: [] })).toBe(false)
})

test('Not predicate', () => {
    const expense: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }
    const income: IncomeOperation = {
        id: '',
        type: 'income',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: 1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: 1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }

    const notExpense = compilePredicate(PE.not(PE.type('expense')))

    expect(notExpense(expense)).toBe(false)
    expect(notExpense(income)).toBe(true)
})

test('Cat predicate', () => {
    const f = compilePredicate(PE.cat('Food & Drinks'))
    const expense: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(f(expense)).toBe(false)
    expect(f({ ...expense, categories: [{ name: 'Foo', amount: -1 }] })).toBe(false)
    expect(f({ ...expense, categories: [{ name: 'Food & Drinks', amount: -1 }] })).toBe(true)

    const transfer: TransferOperation = {
        id: '',
        type: 'transfer',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: 1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        toAccount: {
            name: 'Account2',
            amount: 1
        },
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(f(transfer)).toBe(false)
})

test('Uncategorized predicate', () => {
    const f = compilePredicate(PE.uncat())
    const expense: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(f(expense)).toBe(true)
    expect(f({ ...expense, categories: [{ name: 'Foo', amount: -1 }] })).toBe(false)

    const transfer: TransferOperation = {
        id: '',
        type: 'transfer',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: 1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        toAccount: {
            name: 'Account2',
            amount: 1
        },
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(f(transfer)).toBe(false)
})

test('Comment predicate', () => {
    const f = compilePredicate(PE.comment('Foo'))
    const op: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [
            {
                name: 'Test category',
                amount: -1
            }
        ],
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(f({ ...op })).toBe(false)
    expect(f({ ...op, comment: '' })).toBe(false)
    expect(f({ ...op, comment: 'Bar' })).toBe(false)
    expect(f({ ...op, comment: 'Foo' })).toBe(true)
    expect(f({ ...op, comment: 'xFoo!' })).toBe(true)
})

test('Account predicate', () => {
    const f = compilePredicate(PE.account('My account'))
    const expense: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [],
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(f(expense)).toBe(false)
    expect(f({ ...expense, account: { name: 'My account', amount: -1 } })).toBe(true)

    const transfer: TransferOperation = {
        id: '',
        type: 'transfer',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: 1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        toAccount: {
            name: 'Account2',
            amount: 1
        },
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(f(transfer)).toBe(false)
    expect(f({ ...transfer, toAccount: { name: 'My account', amount: 1 } })).toBe(true)
})

test('Tag predicate', () => {
    const f = compilePredicate(PE.tag('foo'))
    const op: ExpenseOperation = {
        id: '',
        type: 'expense',
        lastModified: DateTime.utc(),
        date: utcToday(),
        amount: -1,
        currency: 'USD',
        account: {
            name: 'Test account',
            amount: -1
        },
        categories: [
            {
                name: 'Test category',
                amount: -1
            }
        ],
        tags: ['foo', 'bar'],
        comment: null
    }

    expect(f({ ...op })).toBe(true)
    expect(f({ ...op, tags: [] })).toBe(false)
    expect(f({ ...op, tags: ['bar'] })).toBe(false)
    expect(f({ ...op, tags: ['foo'] })).toBe(true)
    expect(f({ ...op, tags: ['bar', 'foo'] })).toBe(true)
    expect(f({ ...op, tags: ['bar', 'foo', 'abc'] })).toBe(true)
})
