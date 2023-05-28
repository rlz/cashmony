import { autorun, makeAutoObservable, observable, runInAction } from 'mobx'
import { FinDataDb } from './finDataDb'
import { type Category } from './model'
import { OperationsModel } from './operations'
import { compareByStats } from '../helpers/stats'

const operationsModel = OperationsModel.instance()

let categoriesModel: CategoriesModel | null = null

export class CategoriesModel {
    private readonly finDataDb = FinDataDb.instance()
    categories: ReadonlyMap<string, Category> = new Map()
    categoriesSorted: readonly string[] = []

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
                currency: 'USD',
                hidden: true
            }
        }

        return category
    }

    async put (category: Category): Promise<void> {
        await this.finDataDb.putCategory(category)

        runInAction(() => {
            this.categories = {
                ...this.categories,
                [category.name]: category
            }
        })
    }

    private async readAll (): Promise<void> {
        const categories = new Map<string, Category>();

        (await this.finDataDb.readAllCategories()).forEach(c => { categories.set(c.name, c) })

        runInAction(() => {
            this.categories = categories
        })
    }
}
