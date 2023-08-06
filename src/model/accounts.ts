import { DateTime } from 'luxon'
import { autorun, makeAutoObservable, observable, runInAction, toJS } from 'mobx'

import { runAsync } from '../helpers/smallTools'
import { compareByStats } from '../helpers/stats'
import { AppState } from './appState'
import { FinDataDb } from './finDataDb'
import { type Account } from './model'
import { OperationsModel } from './operations'
import { PE } from './predicateExpression'
import { calcStats } from './stats'
import { cumulativeIntervalPerAccountReducer } from './statsReducers'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()

let accountsModel: AccountsModel | null = null

export class AccountsModel {
    private readonly finDataDb = FinDataDb.instance()
    accounts: ReadonlyMap<string, Account> | null = null
    accountsSorted: readonly string[] | null = null
    amounts: ReadonlyMap<string, Readonly<Record<string, number>>> | null = null

    private constructor () {
        makeAutoObservable(this, {
            accounts: observable.shallow,
            accountsSorted: observable.shallow,
            amounts: observable.shallow
        })

        autorun(() => {
            if (this.accounts === null || operationsModel.operations === null) {
                return
            }

            const accounts = [...toJS(this.accounts).keys()]

            const stats = new Map<string, number>()

            for (const op of operationsModel.operations) {
                if (op.type === 'deleted') continue

                for (const [c, s] of stats) {
                    stats.set(c, s * 0.999)
                }

                stats.set(op.account.name, (stats.get(op.account.name) ?? 0) + 1)
            }

            runInAction(() => {
                this.accountsSorted = accounts.sort(compareByStats(stats))
            })
        })

        autorun(() => {
            if (this.accounts === null || operationsModel.operations === null) {
                return
            }

            if (operationsModel.operations.length === 0) {
                runInAction(() => {
                    this.amounts = new Map([[appState.today.toISODate() ?? '', this.zeroAmounts()]])
                })
                return
            }

            const today = appState.today

            runAsync(async () => {
                const stats = await calcStats(PE.any(), null, today, {
                    amounts: cumulativeIntervalPerAccountReducer('day')
                })

                const amounts = new Map<string, Readonly<Record<string, number>>>()

                for (const i of stats.amounts) {
                    amounts.set(i.interval.toISODate() ?? '', i.amounts)
                }

                runInAction(() => {
                    this.amounts = amounts
                })
            })
        })

        void this.readAll()
    }

    static instance (): AccountsModel {
        if (accountsModel === null) {
            accountsModel = new AccountsModel()
        }

        return accountsModel
    }

    get (accountName: string): Account {
        if (this.accounts === null) {
            throw Error('Accounts have not been loaded')
        }

        const account = this.accounts.get(accountName)

        if (account === undefined) {
            console.warn(`Account not found: ${accountName}`)
            return {
                name: '-',
                currency: 'USD',
                hidden: true,
                lastModified: DateTime.utc(),
                deleted: true
            }
        }

        return account
    }

    getAmounts (date: DateTime): Readonly<Record<string, number>> {
        if (this.amounts === null) {
            throw Error('Amounts have not been calculated')
        }

        if (operationsModel.operations === null) {
            throw Error('Operations have not been calculated')
        }

        if (operationsModel.operations.length === 0) {
            return this.zeroAmounts()
        }

        const lastOpDate = operationsModel.lastOp?.date ?? appState.today
        if (date > lastOpDate) {
            const amounts = this.amounts.get(lastOpDate.toISODate() ?? '')
            if (amounts === undefined) {
                throw Error('Always expected amount here')
            }
            return amounts
        }

        return this.amounts.get(date.toISODate() ?? '') ?? this.zeroAmounts()
    }

    async put (account: Account): Promise<void> {
        await this.finDataDb.putAccount(account)
        await this.readAll()
    }

    private async readAll (): Promise<void> {
        const accounts = new Map<string, Account>();

        (await this.finDataDb.readAllAccounts()).forEach(a => { accounts.set(a.name, a) })

        runInAction(() => {
            this.accounts = accounts
        })
    }

    private zeroAmounts (): Record<string, number> {
        if (this.accounts === null) {
            throw Error('Accounts not loaded')
        }

        const z: Record<string, number> = {}

        for (const a of this.accounts.values()) {
            z[a.name] = 0
        }

        return z
    }
}
