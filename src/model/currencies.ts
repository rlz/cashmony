import { autorun, makeAutoObservable, observable, runInAction } from 'mobx'
import { CURRENCIES } from '../helpers/currenciesList'
import { OperationsModel } from './operations'
import { compareByStats } from '../helpers/stats'
import { AppState } from './appState'
import { FinDataDb } from './finDataDb'
import { DateTime, type DurationLike } from 'luxon'
import { nonNull, run, runAsync } from '../helpers/smallTools'
import { type CurrencyRates, type CurrencyRatesCache, ratesMonth, CURRENCY_RATES_SCHEMA } from './model'
import { match } from 'ts-pattern'
import { GoalsModel } from './goals'
import { CategoriesModel } from './categories'
import { Operations } from './stats'
import { AccountsModel } from './accounts'

const finDataDb = FinDataDb.instance()
const appState = AppState.instance()
const operationsModel = OperationsModel.instance()
const categoriesModel = CategoriesModel.instance()
const goalsModel = GoalsModel.instance()
const accountsModel = AccountsModel.instance()

let currenciesModel: CurrenciesModel | null = null
const emptyStats: ReadonlyMap<string, number> = new Map()

export class CurrenciesModel {
    currencies: readonly string[] = Object.values(CURRENCIES).map(c => c.code).sort(compareByStats(emptyStats))
    rates: Record<string, readonly number[]> | null = null
    firstDate = appState.timeSpan.endDate

    private constructor () {
        makeAutoObservable(this, {
            rates: observable.shallow
        })

        autorun(() => {
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

        autorun(() => {
            // (d.maslennikov): do we need this?

            // runInAction(() => {
            //     this.rates = null
            // })

            const masterCurrency = appState.masterCurrency
            if (
                operationsModel.operations === null ||
                categoriesModel.categories === null ||
                categoriesModel.categoriesSorted === null ||
                goalsModel.goals === null ||
                accountsModel.accounts === null
            ) {
                return
            }

            const needRates = new Set<string>()
            const firstDate = run(() => {
                const op = operationsModel.firstOp
                if (op === undefined) {
                    return appState.timeSpan.endDate
                }
                return op.date
            })

            const calcNeedRates = (ops: Operations, currency: string): void => {
                for (const op of ops.operations()) {
                    if (op.currency !== currency) {
                        if (op.currency !== 'USD') {
                            needRates.add(`${op.date.toFormat('yyyy/MM')}/${op.currency}`)
                        }

                        if (currency !== 'USD') {
                            needRates.add(`${op.date.toFormat('yyyy/MM')}/${currency}`)
                        }
                    }
                }
            }

            calcNeedRates(Operations.all(), masterCurrency)

            for (const cat of categoriesModel.categories.values()) {
                if (cat.deleted === true || cat.currency === undefined) {
                    continue
                }

                const ops = Operations.all().keepTypes('expense', 'income').keepCategories(cat.name).skipUncategorized()
                calcNeedRates(ops, cat.currency)
            }

            for (const goal of goalsModel.goals ?? []) {
                if (goal.deleted === true) {
                    continue
                }

                const ops = Operations.forFilter(goal.filter).keepTypes('expense', 'income')
                calcNeedRates(ops, goal.currency)
            }

            // to calculate 'Total' on accounts screen
            const date = appState.timeSpan.endDate.toFormat('yyyy/MM')
            for (const acc of accountsModel.accounts.values()) {
                if (acc.currency !== 'USD') {
                    needRates.add(`${date}/${acc.currency}`)
                }
            }
            if (appState.masterCurrency !== 'USD') {
                needRates.add(`${date}/${appState.masterCurrency}`)
            }

            runAsync(async () => {
                const ratesRecord: Record<string, number[]> = {}

                await Promise.all(
                    [...needRates].map(async i => {
                        const month = DateTime.fromFormat(i.substring(0, 7), 'yyyy/MM', { zone: 'utc' })
                        const currency = i.substring(8)
                        let rates = await finDataDb.getRates(month, currency)
                        if (rates === null || (isPartialMonth(rates) && cacheOlderThen(rates, { hour: 1 }))) {
                            const result = await fetch(`/currencies/${i}.json`)
                            if (!result.ok) {
                                console.log(`Can not load rates (${i}): ${result.status} ${result.statusText}`)
                                return
                            }
                            rates = {
                                ...CURRENCY_RATES_SCHEMA.parse(await result.json()),
                                loadDate: DateTime.utc()
                            }
                            await finDataDb.putRates(rates)
                        }

                        if (!(currency in ratesRecord)) {
                            ratesRecord[currency] = []
                        }

                        rates.rates.forEach((r, i) => {
                            const date = month.plus({ days: i })
                            if (date < firstDate) return
                            const ind = date.diff(firstDate, 'days').days
                            ratesRecord[currency][ind] = r
                        })
                    })
                )

                runInAction(() => {
                    this.firstDate = firstDate
                    this.rates = ratesRecord
                })
            })
        })
    }

    getFromUsdRate (date: DateTime, toCurrency: string): number {
        if (this.rates === null) {
            throw Error('Rates not loaded')
        }

        if (toCurrency === 'USD') return 1
        if (date < this.firstDate) {
            // throw Error(`Rate before firstDate requested (firstDate = ${this.firstDate.toISODate() ?? ''}, date = ${date.toISODate() ?? ''})`)
            return 1
        }
        const ind = date.diff(this.firstDate, 'days').days
        const rates = nonNull(
            this.rates[toCurrency],
            `Currency not loaded: ${toCurrency} (loaded: ${Object.keys(this.rates).join(', ')})`
        )

        if (ind >= rates.length) {
            return rates[rates.length - 1]
        }

        return rates[ind]
    }

    getRate (date: DateTime, fromCurrency: string, toCurrency: string): number {
        if (fromCurrency === toCurrency) {
            return 1
        }

        const toUsdRate = match(fromCurrency)
            .with('USD', () => 1)
            .otherwise(() => 1 / this.getFromUsdRate(date, fromCurrency))

        return match(toCurrency)
            .with('USD', () => toUsdRate)
            .otherwise(() => toUsdRate * this.getFromUsdRate(date, toCurrency))
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

function cacheOlderThen (cache: CurrencyRatesCache, duration: DurationLike): boolean {
    return cache.loadDate < DateTime.utc().minus(duration)
}
