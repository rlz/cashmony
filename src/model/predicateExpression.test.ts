import 'regenerator-runtime/runtime'

import { DateTime } from 'luxon'

import { utcToday } from '../helpers/dates'
import { type ExpenseOperation, type TransferOperation } from './model'
import { compilePredicate, PE, predicateToBodyStr } from './predicateExpression'

test('Type predicate', () => {
    expect(predicateToBodyStr(PE.type('expense'))).toBe('return op.type === "expense";')
})

test('And predicate', () => {
    expect(predicateToBodyStr(PE.and(PE.type('expense')))).toBe('return op.type === "expense";')

    expect(predicateToBodyStr(
        PE.and(
            PE.type('expense'),
            PE.type('income')
        )
    )).toBe('return op.type === "expense" && op.type === "income";')

    expect(predicateToBodyStr(
        PE.and(
            PE.type('expense'),
            PE.type('income'),
            PE.type('adjustment')
        )
    )).toBe('return op.type === "expense" && op.type === "income" && op.type === "adjustment";')
})

test('Or predicate', () => {
    expect(predicateToBodyStr(PE.or(PE.type('expense')))).toBe('return op.type === "expense";')

    expect(predicateToBodyStr(
        PE.or(
            PE.type('expense'),
            PE.type('income')
        )
    )).toBe('return op.type === "expense" || op.type === "income";')

    expect(predicateToBodyStr(
        PE.or(
            PE.type('expense'),
            PE.type('income'),
            PE.type('adjustment')
        )
    )).toBe('return op.type === "expense" || op.type === "income" || op.type === "adjustment";')
})

test('Not predicate', () => {
    expect(predicateToBodyStr(PE.not(PE.type('expense')))).toBe('return !(op.type === "expense");')
})

test('Cat predicate', () => {
    expect(predicateToBodyStr(PE.cat('Food & Drinks'))).toBe('return (op.type === "expense" || op.type === "income") && op.categories.some(i => i.name === "Food & Drinks");')

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
    expect(predicateToBodyStr(PE.uncat())).toBe('return (op.type === "expense" || op.type === "income") && op.categories.length === 0;')

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
    expect(predicateToBodyStr(PE.comment('Foo'))).toBe('return op.comment?.indexOf("Foo") >= 0;')

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
    expect(predicateToBodyStr(PE.account('My account'))).toBe('return op.account.name === "My account" || op.type === "transfer" && op.toAccount.name === "My account";')

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
    expect(predicateToBodyStr(PE.tag('foo'))).toBe('return op.tags.includes("foo");')

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
