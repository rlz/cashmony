import { CURRENCIES } from '../currencies/currenciesList'
import { Engine } from './engine'
import { compareByStats } from './statsComparator'

export function sortCurrencies(engine: Engine) {
    if (!engine.initialised) {
        throw Error('Uninitialized engine')
    }

    const currencies = Object.values(CURRENCIES).map(c => c.code)

    const stats = new Map<string, number>()

    for (const op of engine.operations) {
        if (op.type === 'deleted') continue

        for (const [c, s] of stats) {
            stats.set(c, s * 0.999)
        }

        stats.set(op.currency, (stats.get(op.currency) ?? 0) + 1)
    }

    return currencies.sort(compareByStats(stats))
}
