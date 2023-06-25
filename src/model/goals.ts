import { makeAutoObservable, observable, runInAction } from 'mobx'
import { FinDataDb } from './finDataDb'
import { type ExpensesGoal } from './model'

let goalsModel: GoalsModel | null = null

export class GoalsModel {
    private readonly finDataDb = FinDataDb.instance()
    goals: readonly ExpensesGoal[] | null = null

    private constructor () {
        makeAutoObservable(this, {
            goals: observable.shallow
        })

        void this.readAll()
    }

    static instance (): GoalsModel {
        if (goalsModel === null) {
            goalsModel = new GoalsModel()
        }

        return goalsModel
    }

    get (goalName: string): ExpensesGoal | null {
        if (this.goals === null) {
            throw Error('Goals not loaded')
        }

        for (const goal of this.goals) {
            if (goal.name === goalName) {
                return goal
            }
        }

        return null
    }

    async put (goal: ExpensesGoal): Promise<void> {
        await this.finDataDb.putExpensesGoal(goal)
        await this.readAll()
    }

    private async readAll (): Promise<void> {
        const goals = (await this.finDataDb.readAllExpensesGoals()).sort((i1, i2) => i1.name.localeCompare(i2.name))

        runInAction(() => {
            this.goals = goals
        })
    }
}
