import { autorun, makeAutoObservable, observable, runInAction } from 'mobx'
import { FinDataDb } from './finDataDb'
import { type Category } from './model'
import { compareByStats } from '../helpers/stats'
import { DateTime } from 'luxon'
import { Operations } from './stats'

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

            const ops = Operations.all().keepTypes('expense', 'income').skipUncategorized().operations()

            for (const op of ops) {
                if (op.type === 'transfer' || op.type === 'adjustment') continue

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
                lastModified: DateTime.utc(1, 1, 1),
                deleted: true
            }
        }

        return category
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
}
