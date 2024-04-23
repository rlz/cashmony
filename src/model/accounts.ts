import { DateTime } from 'luxon'
import { autorun, makeAutoObservable, observable, runInAction, toJS } from 'mobx'

import { compareByStats } from '../helpers/stats'
import { FinDataDb } from './finDataDb'
import { type Account } from './model'
import { OperationsModel } from './operations'

const operationsModel = OperationsModel.instance()

let accountsModel: AccountsModel | null = null

export class AccountsModel {
    private readonly finDataDb = FinDataDb.instance()

    accounts: ReadonlyMap<string, Account> | null = null
    accountsSorted: readonly string[] | null = null

    private constructor() {
        makeAutoObservable(this, {
            accounts: observable.shallow,
            accountsSorted: observable.shallow
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

        void this.readAll()
    }

    static instance(): AccountsModel {
        if (accountsModel === null) {
            accountsModel = new AccountsModel()
        }

        return accountsModel
    }

    get(accountName: string): Account {
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

    async put(account: Account): Promise<void> {
        await this.finDataDb.putAccount(account)
        await this.readAll()
    }

    private async readAll(): Promise<void> {
        const accounts = new Map<string, Account>();

        (await this.finDataDb.readAllAccounts()).forEach((a) => { accounts.set(a.name, a) })

        runInAction(() => {
            this.accounts = accounts
        })
    }
}
