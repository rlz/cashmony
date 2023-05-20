import { autorun, makeAutoObservable, runInAction } from 'mobx'
import { OperationsModel } from './operations'

let tagsModel: TagsModel | null = null

export class TagsModel {
    expense: readonly string[] = []
    income: readonly string[] = []
    adjustment: readonly string[] = []
    transfer: readonly string[] = []
    all: readonly string[] = []

    private constructor () {
        makeAutoObservable(this)

        autorun(() => {
            const ops = OperationsModel.instance()

            const tagsStats: {
                expense: Record<string, number>
                income: Record<string, number>
                adjustment: Record<string, number>
                transfer: Record<string, number>
                all: Record<string, number>
            } = {
                expense: {},
                income: {},
                adjustment: {},
                transfer: {},
                all: {}
            }

            const agingTags = (tags: Record<string, number>): void => {
                for (const t in tags) {
                    tags[t] = tags[t] * 0.99
                }
            }

            const addTags = (tags: readonly string[], toTags: Record<string, number>): void => {
                agingTags(toTags)

                for (const t of tags) {
                    if (t in toTags) {
                        toTags[t] += 1
                    } else {
                        toTags[t] = 1
                    }
                }
            }

            for (const o of ops.operations) {
                if (o.type === 'deleted') {
                    continue
                }

                addTags(o.tags, tagsStats[o.type])
                addTags(o.tags, tagsStats.all)
            }

            const sortTags = (tags: Record<string, number>): string[] => {
                return Object.entries(tags).sort((t1, t2) => t2[1] - t1[1]).map(t => t[0])
            }

            runInAction(() => {
                this.adjustment = sortTags(tagsStats.adjustment)
                this.expense = sortTags(tagsStats.expense)
                this.income = sortTags(tagsStats.income)
                this.transfer = sortTags(tagsStats.transfer)
                this.all = sortTags(tagsStats.all)
            })
        })
    }

    static instance (): TagsModel {
        if (tagsModel === null) {
            tagsModel = new TagsModel()
        }
        return tagsModel
    }
}

export function mergeTags (main: readonly string[], additional: readonly string[]): string[] {
    const s = new Set<string>(main)

    return [
        ...main,
        ...additional.filter(i => !s.has(i))
    ]
}
