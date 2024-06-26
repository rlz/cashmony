import { Engine } from './engine'
import { compareByStats } from './statsComparator'

export class TagsEngine {
    private readonly engine: Engine

    expense: readonly string[] = []
    income: readonly string[] = []
    adjustment: readonly string[] = []
    transfer: readonly string[] = []
    all: readonly string[] = []
    byCat: ReadonlyMap<string, readonly string[]> = new Map()

    constructor(engine: Engine) {
        this.engine = engine

        if (!engine.initialised) {
            return
        }

        const tagsStats = {
            expense: new Map<string, number>(),
            income: new Map<string, number>(),
            adjustment: new Map<string, number>(),
            transfer: new Map<string, number>(),
            all: new Map<string, number>()
        }
        const byCat = new Map<string, Map<string, number>>()

        const agingTags = (tags: Map<string, number>): void => {
            for (const [tag, stat] of tags) {
                tags.set(tag, stat * 0.999)
            }
        }

        const addTags = (tags: readonly string[], toTags: Map<string, number>): void => {
            agingTags(toTags)

            for (const t of tags) {
                toTags.set(t, (toTags.get(t) ?? 0) + 1)
            }
        }

        const addTagsToCat = (tags: readonly string[], categories: string[]): void => {
            for (const cat of categories) {
                let catStats = byCat.get(cat)
                if (catStats === undefined) {
                    catStats = new Map()
                    byCat.set(cat, catStats)
                }

                addTags(tags, catStats)
            }
        }

        for (const o of engine.operations) {
            if (o.type === 'deleted') {
                continue
            }

            addTags(o.tags, tagsStats[o.type])
            addTags(o.tags, tagsStats.all)

            if (o.type === 'expense' || o.type === 'income') {
                addTagsToCat(o.tags, o.categories.map(c => c.id))
            }
        }

        const sortTags = (tags: Map<string, number>): string[] => {
            return [...tags.keys()].sort(compareByStats(tags))
        }

        this.adjustment = sortTags(tagsStats.adjustment)
        this.expense = sortTags(tagsStats.expense)
        this.income = sortTags(tagsStats.income)
        this.transfer = sortTags(tagsStats.transfer)
        this.all = sortTags(tagsStats.all)
        this.byCat = new Map(byCat.entries().map(([cat, catStats]) => [cat, sortTags(catStats)]))
    }
}

export function mergeTags(
    addedTags: readonly string[],
    catTags: readonly string[],
    opTypeTags: readonly string[],
    allTags: readonly string[]
): string[] {
    const atSet = new Set(addedTags)
    const ctSet = new Set<string>(catTags)
    const ottSet = new Set<string>(opTypeTags)

    return [
        ...addedTags,
        ...catTags.filter(i => !atSet.has(i)),
        ...opTypeTags.filter(i => !(atSet.has(i) || ctSet.has(i))),
        ...allTags.filter(i => !(atSet.has(i) || ctSet.has(i) || ottSet.has(i)))
    ]
}
