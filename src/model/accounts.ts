import { DateTime } from 'luxon'
import { autorun, makeAutoObservable, observable, runInAction, toJS } from 'mobx'

import { utcToday } from '../helpers/dates'
import { compareByStats } from '../helpers/stats'
import { AppState } from './appState'
import { FinDataDb } from './finDataDb'
import { type Account, type NotDeletedOperation } from './model'
import { OperationsModel } from './operations'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()

let accountsModel: AccountsModel | null = null

export class AccountsModel {
    private readonly finDataDb = FinDataDb.instance()
    accounts: ReadonlyMap<string, Account> | null = null
    accountsSorted: readonly string[] | null = null
    amounts: ReadonlyMap<string, ReadonlyMap<string, number>> | null = null

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

            const firstOp = operationsModel.operations.find(o => o.type !== 'deleted') as NotDeletedOperation

            if (firstOp === undefined) {
                this.amounts = new Map([[utcToday().toISODate() ?? '', new Map(Array.from(this.accounts.values()).map(account => [account.name, 0]))]])
                return
            }

            const today = utcToday()
            const amounts = new Map<string, ReadonlyMap<string, number>>()
            const currentAmounts = new Map(Array.from(this.accounts.values()).map(account => [account.name, 0]))
            let currentOpIndex = 0
            const operationsLength = operationsModel.operations.length
            for (let date = firstOp.date.minus({ day: 1 }); date <= today; date = date.plus({ day: 1 })) {
                while (currentOpIndex < operationsLength) {
                    const currentOp = operationsModel.operations[currentOpIndex]

                    if (currentOp.type === 'deleted') {
                        currentOpIndex++
                        continue
                    }

                    if (currentOp.date > date) {
                        break
                    }

                    const amount = currentAmounts.get(currentOp.account.name)

                    if (amount === undefined) {
                        throw Error(`Unknown account: ${currentOp.account.name}`)
                    }

                    currentAmounts.set(currentOp.account.name, amount + currentOp.account.amount)

                    if (currentOp.type === 'transfer') {
                        const amount = currentAmounts.get(currentOp.toAccount.name)

                        if (amount === undefined) {
                            throw Error(`Unknown account: ${currentOp.account.name}`)
                        }

                        currentAmounts.set(currentOp.toAccount.name, amount + currentOp.toAccount.amount)
                    }

                    currentOpIndex++
                }
                amounts.set(date.toISODate() ?? '', new Map(currentAmounts))
            }

            runInAction(() => {
                this.amounts = amounts
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

    getAmounts (date: DateTime): ReadonlyMap<string, number> {
        if (this.amounts === null) {
            throw Error('Amounts have not been calculated')
        }

        if (date > appState.today) {
            const amounts = this.amounts.get(appState.today.toISODate() ?? '')
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

    private zeroAmounts (): Map<string, number> {
        return new Map([...this.accounts?.values() ?? []].map(i => [i.name, 0]))
    }
}
