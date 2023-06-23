import { autorun, makeAutoObservable, observable, runInAction } from 'mobx'
import { FinDataDb } from './finDataDb'
import { type NotDeletedOperation, type Category } from './model'
import { OperationsModel } from './operations'
import { compareByStats } from '../helpers/stats'
import { utcToday } from '../helpers/dates'
import { DateTime } from 'luxon'
import { AppState } from './appState'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()

let categoriesModel: CategoriesModel | null = null

export class CategoriesModel {
    private readonly finDataDb = FinDataDb.instance()
    categories: ReadonlyMap<string, Category> = new Map()
    categoriesSorted: readonly string[] = []
    amounts: ReadonlyMap<string, ReadonlyMap<string, number>> = new Map()

    private constructor () {
        makeAutoObservable(this, {
            categories: observable.shallow,
            categoriesSorted: observable.shallow
        })

        autorun(() => {
            if (this.categories.size === 0) {
                return
            }

            const stats = new Map<string, number>()

            for (const op of operationsModel.operations) {
                if (op.type === 'deleted' || op.type === 'transfer' || op.type === 'adjustment') continue

                for (const [c, s] of stats) {
                    stats.set(c, s * 0.999)
                }

                for (const { name } of op.categories) {
                    stats.set(name, (stats.get(name) ?? 0) + 1)
                }
            }

            runInAction(() => {
                this.categoriesSorted = [...this.categories.keys()].sort(compareByStats(stats))
            })
        })

        autorun(() => {
            if (this.categories.size === 0) {
                this.amounts = new Map([[utcToday().toISODate() ?? '', new Map()]])
                return
            }

            const firstOp = operationsModel.operations.find(o => o.type !== 'deleted') as NotDeletedOperation

            if (firstOp === undefined) {
                this.amounts = new Map([[utcToday().toISODate() ?? '', this.zeroAmounts()]])
                return
            }

            const today = utcToday()
            const amounts = new Map<string, ReadonlyMap<string, number>>()
            const currentAmounts = new Map([...this.categories.values()].map(category => [category.name, 0]))
            let currentOpIndex = 0
            const operationsLength = operationsModel.operations.length

            for (let date = firstOp.date.minus({ day: 1 }); date <= today; date = date.plus({ day: 1 })) {
                while (currentOpIndex < operationsLength) {
                    const currentOp = operationsModel.operations[currentOpIndex]

                    if (currentOp.type !== 'income' && currentOp.type !== 'expense') {
                        currentOpIndex++
                        continue
                    }

                    if (currentOp.date > date) {
                        break
                    }

                    for (const category of currentOp.categories) {
                        const amount = currentAmounts.get(category.name)

                        if (amount === undefined) {
                            throw Error(`Unknown category: ${category.name}`)
                        }

                        currentAmounts.set(category.name, amount + category.amount)
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

    static instance (): CategoriesModel {
        if (categoriesModel === null) {
            categoriesModel = new CategoriesModel()
        }

        return categoriesModel
    }

    get (catName: string): Category {
        const category = this.categories.get(catName)

        if (category === undefined) {
            console.warn(`Category not found: ${catName}`)
            return {
                name: '-',
                hidden: true,
                lastModified: DateTime.utc(1, 1, 1),
                deleted: true
            }
        }

        return category
    }

    getAmounts (date: DateTime): ReadonlyMap<string, number> {
        if (date > appState.today) {
            const amounts = this.amounts.get(appState.today.toISODate() ?? '')
            if (amounts === undefined) {
                throw Error('Always expected amount here')
            }
            return amounts
        }

        return this.amounts.get(date.toISODate() ?? '') ?? this.zeroAmounts()
    }

    async put (category: Category): Promise<void> {
        await this.finDataDb.putCategory(category)
        await this.readAll()
    }

    private async readAll (): Promise<void> {
        const categories = new Map<string, Category>();

        (await this.finDataDb.readAllCategories()).forEach(c => { categories.set(c.name, c) })

        runInAction(() => {
            this.categories = categories
        })
    }

    private readonly zeroAmounts = (): Map<string, number> => new Map(Array.from(this.categories.values()).map(category => [category.name, 0]))
}
