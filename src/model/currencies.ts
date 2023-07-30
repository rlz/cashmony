import { DateTime } from 'luxon'
import { autorun, makeAutoObservable, runInAction } from 'mobx'

import { CURRENCIES } from '../helpers/currenciesList'
import { nonNull } from '../helpers/smallTools'
import { compareByStats } from '../helpers/stats'
import { FinDataDb } from './finDataDb'
import { CURRENCY_RATES_SCHEMA, type CurrencyRates, type CurrencyRatesCache, ratesMonth } from './model'
import { OperationsModel } from './operations'

const finDataDb = FinDataDb.instance()
const operationsModel = OperationsModel.instance()

let currenciesModel: CurrenciesModel | null = null
const emptyStats: ReadonlyMap<string, number> = new Map()

export class CurrenciesModel {
    // key is year-month-cur as 2023-01-EUR
    private rates: Record<string, CurrencyRatesCache> = {}

    currencies: readonly string[] = Object.values(CURRENCIES).map(c => c.code).sort(compareByStats(emptyStats))

    private constructor () {
        makeAutoObservable(this)

        autorun(() => {
            if (operationsModel.operations === null) {
                return
            }

            const stats = new Map<string, number>()

            for (const op of operationsModel.operations) {
                if (op.type === 'deleted') continue

                for (const [c, s] of stats) {
                    stats.set(c, s * 0.999)
                }

                stats.set(op.currency, (stats.get(op.currency) ?? 0) + 1)
            }

            runInAction(() => {
                this.currencies = [...this.currencies].sort(compareByStats(stats))
            })
        })
    }

    async getFromUsdRate (date: DateTime, toCurrency: string): Promise<number> {
        if (toCurrency === 'USD') return 1

        const key = `${date.toFormat('yyyy-MM')}-${toCurrency}`

        let rates = this.rates[key]

        if (rates === undefined || (isPartialMonth(rates) && oldCache(rates))) {
            rates = await loadRates(date, toCurrency)
            this.rates[key] = rates
        }

        const ind = date.day - 1

        if (ind >= rates.rates.length) {
            return rates.rates[rates.rates.length - 1]
        }

        return rates.rates[ind]
    }

    async getRate (date: DateTime, fromCurrency: string, toCurrency: string): Promise<number> {
        if (fromCurrency === toCurrency) {
            return 1
        }

        const toUsdRate = fromCurrency === 'USD' ? 1 : 1 / await this.getFromUsdRate(date, fromCurrency)

        return toCurrency === 'USD' ? toUsdRate : toUsdRate * await this.getFromUsdRate(date, toCurrency)
    }

    static instance (): CurrenciesModel {
        if (currenciesModel === null) {
            currenciesModel = new CurrenciesModel()
        }

        return currenciesModel
    }
}

function isPartialMonth (rates: CurrencyRates): boolean {
    const daysInMonth = nonNull(ratesMonth(rates).daysInMonth, `Can not get daysInMonth for ${rates.month}`)
    return rates.rates.length < daysInMonth
}

function oldCache (cache: CurrencyRatesCache): boolean {
    return cache.loadDate < DateTime.utc().minus({ hours: 6 })
}

async function loadRates (month: DateTime, currency: string): Promise<CurrencyRatesCache> {
    const cache = await finDataDb.getRates(month, currency)

    if (cache !== null && (!isPartialMonth(cache) || !oldCache(cache))) {
        return cache
    }

    const result = await fetch(`/currencies/${month.toFormat('yyyy')}/${month.toFormat('MM')}/${currency}.json`)
    if (!result.ok) {
        throw Error(`Can not load rates (${month.toFormat('yyyy-MM')}, ${currency}): ${result.status} ${result.statusText}`)
    }

    const loadedCache = {
        ...CURRENCY_RATES_SCHEMA.parse(await result.json()),
        loadDate: DateTime.utc()
    }
    await finDataDb.putRates(loadedCache)

    return loadedCache
}
