import { autorun, makeAutoObservable, runInAction } from 'mobx'
import { CURRENCIES } from '../helpers/currenciesList'
import { OperationsModel } from './operations'

const operationsModel = OperationsModel.instance()

let currenciesModel: CurrenciesModel | null = null
const emptyStats: ReadonlyMap<string, number> = new Map()

export class CurrenciesModel {
    currencies: readonly string[] = Object.values(CURRENCIES).map(c => c.code).sort((c1, c2) => compare(c1, c2, emptyStats))

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

            console.log(stats)

            runInAction(() => {
                this.currencies = [...this.currencies].sort((c1, c2) => compare(c1, c2, stats))
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

function compare (c1: string, c2: string, stats: ReadonlyMap<string, number>): number {
    const c1Stats = stats.get(c1) ?? 0
    const c2Stats = stats.get(c2) ?? 0

    if (c1Stats === c2Stats) {
        return c1.localeCompare(c2)
    }

    return c1Stats < c2Stats ? 1 : -1
}
