import { makeAutoObservable, observable, runInAction } from 'mobx'
import { FinDataDb } from './finDataDb'
import { type Category } from './model'

let categoriesModel: CategoriesModel | null = null

export class CategoriesModel {
    private readonly finDataDb = FinDataDb.instance()
    categories: Readonly<Record<string, Category>> = {}

    private constructor () {
        makeAutoObservable(this, {
            categories: observable.shallow
        })

        void this.readAll()
    }

    static instance (): CategoriesModel {
        if (categoriesModel === null) {
            categoriesModel = new CategoriesModel()
        }

        return categoriesModel
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
        const categories: Record<string, Category> = {};

        (await this.finDataDb.readAllCategories()).forEach(a => { categories[a.name] = a })

        runInAction(() => {
            this.categories = categories
        })
    }
}
