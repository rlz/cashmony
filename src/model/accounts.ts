import { makeAutoObservable, observable, runInAction } from 'mobx'
import { FinDataDb } from './finDataDb'
import { type Account } from './model'

let accountsModel: AccountsModel | null = null

export class AccountsModel {
    private readonly finDataDb = FinDataDb.instance()
    accounts: Readonly<Record<string, Account>> = {}

    private constructor () {
        makeAutoObservable(this, {
            accounts: observable.shallow
        })

        void this.readAll()
    }

    static instance (): AccountsModel {
        if (accountsModel === null) {
            accountsModel = new AccountsModel()
        }

        return accountsModel
    }

    async put (account: Account): Promise<void> {
        await this.finDataDb.putAccount(account)

        runInAction(() => {
            this.accounts = {
                ...this.accounts,
                [account.name]: account
            }
        })
    }

    private async readAll (): Promise<void> {
        const accounts: Record<string, Account> = {};

        (await this.finDataDb.readAllAccounts()).forEach(a => { accounts[a.name] = a })

        runInAction(() => {
            this.accounts = accounts
        })
    }
}
