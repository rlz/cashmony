import { Engine } from './engine'
import { Category } from './model'
import { PE } from './predicateExpression'
import { listOperations } from './stats'
import { compareByStats } from './statsComparator'

export function sortCategoriesByUsage(engine: Engine): Category[] {
    engine.requireInitialized()

    const stats = new Map<string, number>()

    const ops = listOperations(engine, PE.not(PE.uncat()), null)

    for (const op of ops) {
        if (op.type === 'transfer' || op.type === 'adjustment') continue

        for (const [c, s] of stats) {
            stats.set(c, s * 0.999)
        }

        for (const { id } of op.categories) {
            stats.set(id, (stats.get(id) ?? 0) + 1)
        }
    }

    const comparator = compareByStats(stats)

    return [...engine.categories].sort((c1, c2) => comparator(c1.id, c2.id))
}
