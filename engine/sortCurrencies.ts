import { CURRENCIES } from '../currencies/currenciesList.js'
import { Engine } from './engine.js'
import { compareByStats } from './statsComparator.js'

const rank = [
    'USD',
    'EUR',
    'JPY',
    'GBP',
    'CNY',
    'AUD',
    'CAD',
    'CHF',
    'HKD',
    'SGD',
    'SEK',
    'KRW',
    'NOK',
    'NZD',
    'INR',
    'MXN',
    'TWD',
    'ZAR',
    'BRL',
    'DKK',
    'PLN',
    'THB',
    'ILS',
    'IDR',
    'CZK',
    'AED',
    'TRY',
    'HUF',
    'CLP',
    'SAR',
    'PHP',
    'MYR',
    'COP',
    'RUB',
    'RON',
    'PEN',
    'BHD',
    'BGN',
    'ARS'
].map((c, i): [string, number] => [c, (100 - i) / 100])

export function sortCurrencies(engine: Engine) {
    if (!engine.initialised) {
        throw Error('Uninitialized engine')
    }

    const currencies = Object.values(CURRENCIES).map(c => c.code)

    const stats = new Map<string, number>(rank)

    for (const op of engine.operations) {
        if (op.type === 'deleted') continue

        for (const [c, s] of stats) {
            stats.set(c, s * 0.999)
        }

        stats.set(op.currency, (stats.get(op.currency) ?? 0) + 1)
    }

    return currencies.sort(compareByStats(stats))
}
