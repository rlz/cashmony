import { action, computed, makeObservable, observable, runInAction } from 'mobx'

import { Account, Category, NotDeletedOperation, Operation, Watch } from './model.js'
import { operationComparator } from './operationsComparator.js'
import { compareByStats } from './statsComparator.js'

export interface EngineDataChangeListener {
    onAccountChange?: (a: Account) => void | Promise<void>
    onCategoryChange?: (c: Category) => void | Promise<void>
    onOperationChange?: (o: Operation) => void | Promise<void>
    onOperationsChange?: (o: readonly Operation[]) => void | Promise<void>
    onWatchChange?: (w: Watch) => void | Promise<void>
    onClearData?: () => void | Promise<void>
}

export class Engine {
    initialised: boolean = false

    accounts: readonly Account[] = []
    categories: readonly Category[] = []
    operations: readonly Operation[] = []
    watches: readonly Watch[] = []

    private readonly subscribtions: EngineDataChangeListener[] = []

    constructor() {
        makeObservable(
            this,
            {
                initialised: observable,
                accounts: observable.shallow,
                categories: observable.shallow,
                operations: observable.shallow,
                watches: observable.shallow,
                init: action,
                accountsSortedByUsage: computed,
                pushAccount: action,
                pushCategory: action,
                pushOperation: action,
                pushOperations: action,
                pushWatch: action,
                accountsById: computed,
                accountsByName: computed,
                categoriesById: computed,
                categoriesByName: computed,
                watchesById: computed,
                watchesByName: computed
            }
        )
    }

    subscribe(listener: EngineDataChangeListener) {
        this.subscribtions.push(listener)
    }

    init(accounts: readonly Account[], categories: readonly Category[], operations: readonly Operation[], watches: readonly Watch[]) {
        this.initialised = true
        this.accounts = accounts
        this.categories = categories
        this.operations = [...operations].sort(operationComparator)
        this.watches = watches
    }

    requireInitialized() {
        if (!this.initialised) {
            throw Error('Uninitialized engine')
        }
    }

    getAccount(id: string): Account {
        this.requireInitialized()

        const i = this.accountsById[id]

        if (i === undefined) {
            throw Error(`Account is not found (id: ${id})`)
        }

        return i
    }

    getAccountByName(name: string): Account {
        this.requireInitialized()

        const i = this.accountsByName[name]

        if (i === undefined) {
            throw Error(`Account is not found (name: ${name})`)
        }

        return i
    }

    hasAccountWithName(name: string): boolean {
        this.requireInitialized()

        return this.accountsByName[name] !== undefined
    }

    get accountsSortedByUsage(): readonly Account[] {
        this.requireInitialized()

        const ids = this.accounts.map(i => i.id)

        const stats = new Map<string, number>()

        for (const op of this.operations) {
            if (op.type === 'deleted') continue

            for (const [c, s] of stats) {
                stats.set(c, s * 0.999)
            }

            stats.set(op.account.id, (stats.get(op.account.id) ?? 0) + 1)
        }

        ids.sort(compareByStats(stats))

        return ids.map(i => this.getAccount(i))
    }

    pushAccount(a: Account) {
        this.requireInitialized()

        this.accounts = [...this.accounts.filter(i => i.id !== a.id), a]
        this.subscribtions.forEach((l) => {
            if (l.onAccountChange !== undefined) {
                void l.onAccountChange(a)
            }
        })
    }

    getCategory(id: string): Category {
        this.requireInitialized()

        const i = this.categoriesById[id]

        if (i === undefined) {
            throw Error(`Category is not found (id: ${id})`)
        }

        return i
    }

    getCategoryByName(name: string): Category {
        this.requireInitialized()

        const i = this.categoriesByName[name]

        if (i === undefined) {
            throw Error(`Category is not found (name: ${name})`)
        }

        return i
    }

    hasCategoryWithName(name: string): boolean {
        this.requireInitialized()

        return this.categoriesByName[name] !== undefined
    }

    pushCategory(c: Category) {
        this.requireInitialized()

        this.categories = [...this.categories.filter(i => i.id !== c.id), c]
        this.subscribtions.forEach((l) => {
            if (l.onCategoryChange !== undefined) {
                void l.onCategoryChange(c)
            }
        })
    }

    getWatch(id: string): Watch {
        this.requireInitialized()

        const i = this.watchesById[id]

        if (i === undefined) {
            throw Error(`Watch is not found (id: ${id})`)
        }

        return i
    }

    getWatchByName(name: string): Watch {
        this.requireInitialized()

        const i = this.watchesByName[name]

        if (i === undefined) {
            throw Error(`Watch is not found (name: ${name})`)
        }

        return i
    }

    hasWatchWithName(name: string): boolean {
        this.requireInitialized()

        return this.watchesByName[name] !== undefined
    }

    pushWatch(w: Watch) {
        this.requireInitialized()

        this.watches = [...this.watches.filter(i => i.id !== w.id), w]
        this.subscribtions.forEach((l) => {
            if (l.onWatchChange !== undefined) {
                void l.onWatchChange(w)
            }
        })
    }

    pushOperation(o: Operation) {
        this.requireInitialized()

        this.operations = [...this.operations.filter(i => i.id !== o.id), o].sort(operationComparator)
        this.subscribtions.forEach((l) => {
            if (l.onOperationChange !== undefined) {
                void l.onOperationChange(o)
            }
        })
    }

    pushOperations(ops: readonly Operation[]) {
        this.requireInitialized()

        const ids = new Set(ops.values().map(o => o.id))
        this.operations = [...this.operations.filter(i => !ids.has(i.id)), ...ops].sort(operationComparator)
        this.subscribtions.forEach((l) => {
            if (l.onOperationsChange !== undefined) {
                void l.onOperationsChange(ops)
            }
        })
    }

    get firstOp(): NotDeletedOperation | undefined {
        this.requireInitialized()

        for (const op of this.operations) {
            if (op.type !== 'deleted') {
                return op
            }
        }
    }

    get lastOp(): NotDeletedOperation | undefined {
        this.requireInitialized()

        if (this.operations.length === 0) {
            return
        }

        const op = this.operations[this.operations.length - 1]

        if (op.type !== 'deleted') {
            return op
        }
    }

    getOperation(id: string): Operation {
        this.requireInitialized()

        const op = this.operations.find(op => op.id === id)

        if (op === undefined) {
            throw Error(`Operation is not found (id: ${id})`)
        }

        return op
    }

    async clearData() {
        runInAction(() => {
            this.accounts = []
            this.categories = []
            this.accounts = []
            this.watches = []
            this.operations = []
        })

        await Promise.all(this.subscribtions.map(async (s) => {
            if (s.onClearData !== undefined) {
                await s.onClearData()
            }
        }))
    }

    get accountsById(): Readonly<Record<string, Account>> {
        return Object.fromEntries(this.accounts.map(i => [i.id, i]))
    }

    get accountsByName(): Readonly<Record<string, Account>> {
        return Object.fromEntries(
            this.accounts
                .values()
                .filter(i => i.deleted !== true)
                .map(i => [i.name, i])
        )
    }

    get categoriesById(): Readonly<Record<string, Category>> {
        return Object.fromEntries(this.categories.map(i => [i.id, i]))
    }

    get categoriesByName(): Readonly<Record<string, Category>> {
        return Object.fromEntries(
            this.categories
                .filter(i => i.deleted !== true)
                .map(i => [i.name, i])
        )
    }

    get watchesById(): Readonly<Record<string, Watch>> {
        return Object.fromEntries(this.watches.map(i => [i.id, i]))
    }

    get watchesByName(): Readonly<Record<string, Watch>> {
        return Object.fromEntries(
            this.watches
                .filter(i => i.deleted !== true)
                .map(i => [i.name, i])
        )
    }
}
