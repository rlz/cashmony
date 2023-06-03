import { autorun, makeAutoObservable, observable, runInAction, toJS } from 'mobx'
import { FinDataDb } from './finDataDb'
import { type NotDeletedOperation, type Account } from './model'
import { OperationsModel } from './operations'
import { utcToday } from '../helpers/dates'
import { compareByStats } from '../helpers/stats'
import { DateTime } from 'luxon'

const operationsModel = OperationsModel.instance()

let accountsModel: AccountsModel | null = null

export class AccountsModel {
    private readonly finDataDb = FinDataDb.instance()
    accounts: ReadonlyMap<string, Account> = new Map()
    accountsSorted: readonly string[] = []
    amounts: ReadonlyMap<string, ReadonlyMap<string, number>> = new Map()

    private constructor () {
        makeAutoObservable(this, {
            accounts: observable.shallow,
            accountsSorted: observable.shallow,
            amounts: observable.shallow
        })

        autorun(() => {
            if (this.accounts.size === 0) {
                return
            }

            const stats = new Map<string, number>()

            for (const op of operationsModel.operations) {
                if (op.type === 'deleted') continue

                for (const [c, s] of stats) {
                    stats.set(c, s * 0.999)
                }

                stats.set(op.account.name, (stats.get(op.account.name) ?? 0) + 1)
            }

            runInAction(() => {
                this.accountsSorted = [...toJS(this.accounts).keys()].sort(compareByStats(stats))
            })
        })

        autorun(() => {
            if (this.accounts.size === 0) {
                this.amounts = new Map([[utcToday().toISODate() ?? '', new Map()]])
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

                    // console.log('Processing op', currentOp)

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
                // console.log(date.toISO(), Object.fromEntries(currentAmounts))
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

    async put (account: Account): Promise<void> {
        await this.finDataDb.putAccount({ ...account, lastModified: DateTime.utc() })
        await this.readAll()
    }

    private async readAll (): Promise<void> {
        const accounts = new Map<string, Account>();

        (await this.finDataDb.readAllAccounts()).forEach(a => { accounts.set(a.name, a) })

        runInAction(() => {
            this.accounts = accounts
        })
    }
}
