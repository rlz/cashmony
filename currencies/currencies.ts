import { Mutex } from 'async-mutex'
import { IDBPDatabase, openDB } from 'idb'
import { DateTime } from 'luxon'

import { utcToday } from '../engine/dates.js'
import { nonNull } from '../front/helpers/smallTools.js'
import { CURRENCY_RATES_SCHEMA, CurrencyRates, CurrencyRatesCache, ratesMonth } from './model.js'

const RATES_STORE_NAME = 'rates'

export class CurrenciesLoader {
    // key is year-month-cur as 2023-01-EUR
    private rates: Record<string, CurrencyRatesCache> = {}

    async getFromUsdRate(date: DateTime, toCurrency: string): Promise<number> {
        // console.log('getFromUsdRate', date.toISODate(), toCurrency)

        if (date > DateTime.now()) {
            date = utcToday()
        }

        if (toCurrency === 'USD') return 1

        const key = `${date.toFormat('yyyy-MM')}-${toCurrency}`

        return await runExclusive(key, async () => {
            let rates: CurrencyRatesCache | undefined = this.rates[key]

            if (rates === undefined || (isPartialMonth(rates) && oldCache(rates))) {
                rates = await loadRates(date, toCurrency)
                if (rates === undefined || rates.rates.length === 0) {
                    return await this.getFromUsdRate(date.set({ day: 1 }).minus({ day: 1 }), toCurrency)
                }
                this.rates[key] = rates
            }

            const ind = date.day - 1

            if (ind >= rates.rates.length) {
                return rates.rates[rates.rates.length - 1]
            }

            return rates.rates[ind]
        })
    }

    async getRate(date: DateTime, fromCurrency: string, toCurrency: string): Promise<number> {
        if (fromCurrency === toCurrency) {
            return 1
        }

        const toUsdRate = fromCurrency === 'USD' ? 1 : 1 / await this.getFromUsdRate(date, fromCurrency)

        return toCurrency === 'USD' ? toUsdRate : toUsdRate * await this.getFromUsdRate(date, toCurrency)
    }
}

function isPartialMonth(rates: CurrencyRates): boolean {
    const daysInMonth = nonNull(ratesMonth(rates).daysInMonth, `Can not get daysInMonth for ${rates.month}`)
    return rates.rates.length < daysInMonth
}

function oldCache(cache: CurrencyRatesCache): boolean {
    return cache.loadDate < DateTime.utc().minus({ hours: 6 })
}

async function loadRates(month: DateTime, currency: string): Promise<CurrencyRatesCache | undefined> {
    const cache = await getRates(month, currency)

    if (cache !== null && (!isPartialMonth(cache) || !oldCache(cache))) {
        return cache
    }

    if (month.toMillis() === utcToday().toMillis()) {
        // rates not available yet
        return
    }

    // console.log('Need load', `https://rlz.github.io/exchange-rates/rates/${month.toFormat('yyyy')}/${month.toFormat('MM')}/${currency}.json`)

    const result = await fetch(`https://rlz.github.io/exchange-rates/rates/${month.toFormat('yyyy')}/${month.toFormat('MM')}/${currency}.json`)

    // console.log('Load result', result)

    if (!result.ok || result.headers.get('Content-Type')?.startsWith('application/json') !== true) {
        // console.log('contenttype', result.headers.get('Content-Type'))
        console.warn(`Can not load rates (${month.toFormat('yyyy-MM')}, ${currency}): ${result.status} ${result.statusText} Content-Type: ${result.headers.get('Content-Type')}`)
        return
    }

    const loadedCache = {
        ...CURRENCY_RATES_SCHEMA.parse(await result.json()),
        loadDate: DateTime.utc()
    }
    await putRates(loadedCache)

    return loadedCache
}

async function openDb(): Promise<IDBPDatabase> {
    return await openDB('CurrencyRates', 1, {
        upgrade: (database, oldVersion, _newVersion) => {
            if (oldVersion < 1) {
                database.createObjectStore(RATES_STORE_NAME, { keyPath: 'key' })
            }
        }
    })
}

async function getRates(month: DateTime, currency: string): Promise<CurrencyRatesCache | null> {
    const db = await openDb()

    const cache = await db.get(RATES_STORE_NAME, ratesKey(month, currency))

    if (cache === undefined) return null

    return {
        ...cache,
        loadDate: DateTime.fromISO(cache.loadDate)
    }
}

async function putRates(rates: CurrencyRatesCache): Promise<void> {
    const month = ratesMonth(rates)

    const db = await openDb()
    await db.put(RATES_STORE_NAME, {
        ...rates,
        key: ratesKey(month, rates.currency),
        loadDate: rates.loadDate.toISO()
    })
}

function ratesKey(month: DateTime, currency: string): string {
    return `${month.toFormat('yyyy-MM')}-${currency}`
}

const mutexes: Record<string, Mutex> = {}

async function runExclusive<T>(key: string, action: () => Promise<T>): Promise<T> {
    const m = mutexes[key] = mutexes[key] ?? new Mutex()
    return await m.runExclusive(action)
}
