import { autorun, makeAutoObservable, runInAction } from 'mobx'
import { CURRENCIES } from '../helpers/currenciesList'
import { OperationsModel } from './operations'
import { compareByStats } from '../helpers/stats'

const operationsModel = OperationsModel.instance()

let currenciesModel: CurrenciesModel | null = null
const emptyStats: ReadonlyMap<string, number> = new Map()

export class CurrenciesModel {
    currencies: readonly string[] = Object.values(CURRENCIES).map(c => c.code).sort(compareByStats(emptyStats))

    private constructor () {
        makeAutoObservable(this)
        autorun(() => {
            const stats = new Map<string, number>()

            for (const op of operationsModel.operations) {
                if (op.type === 'deleted') continue

                for (const [c, s] of stats) {
                    stats.set(c, s * 0.999)
                }

                stats.set(op.currency, (stats.get(op.currency) ?? 0) + 1)
            }

            runInAction(() => {
                this.currencies = [...this.currencies].sort(compareByStats(stats))
            })
        })
    }

    static instance (): CurrenciesModel {
        if (currenciesModel === null) {
            currenciesModel = new CurrenciesModel()
        }

        return currenciesModel
    }
}
