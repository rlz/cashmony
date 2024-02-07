import { mkdirSync, writeFileSync } from 'fs'
import _ from 'lodash'
import { DateTime } from 'luxon'
import z from 'zod'

import makeUrl from '../src/google/makeUrl'
import { CURRENCIES } from '../src/helpers/currenciesList'

const YEAR = 2024
const MONTH = 2

const currencies = Object.keys(CURRENCIES).filter(i => i !== 'USD')
const startDate = DateTime.utc(YEAR, MONTH, 1)
const endDate = (() => {
    const d = startDate.plus({ month: 1 }).minus({ days: 1 })
    if (d > DateTime.utc()) return DateTime.utc()
    return d
})()

const RespSchema = z.object({
    widget: z.array(
        z.object({
            baseCurrency: z.literal('USD'),
            quoteCurrency: z.string(),
            data: z.array(z.tuple([z.number(), z.string()]))
        })
    )
})

type RespType = z.infer<typeof RespSchema>

async function loadData (currencies: string[]): Promise<RespType['widget']> {
    const curs: Record<string, string> = {}
    for (let i = 0; i < currencies.length; ++i) {
        curs[`quote_currency_${i}`] = currencies[i]
    }
    const url = makeUrl('https://fxds-hcc.oanda.com/api/data/update/', {
        source: 'OANDA',
        adjustment: '0',
        base_currency: 'USD',
        start_date: startDate.toFormat('yyyy-L-d'),
        end_date: endDate.toFormat('yyyy-L-d'),
        period: 'daily',
        price: 'mid',
        view: 'graph',
        ...curs
    })

    console.log(url)

    const result = await fetch(url, {
        headers: {
            Accept: 'application/json'
        }
    })

    if (!result.ok) {
        throw Error(`Not ok resp (${result.status} ${result.statusText}) for ${url}`)
    }

    return RespSchema.parse(await result.json()).widget
}

async function load (): Promise<void> {
    const tasks: Array<Promise<RespType['widget']>> = []

    for (const curs of _.chunk(currencies, 9)) {
        tasks.push(loadData(curs))
    }

    const loadedRates = _.flatten(await Promise.all(tasks))

    // console.log(loadedRates)

    for (const loadedRate of loadedRates) {
        const year = startDate.toFormat('yyyy')
        const month = startDate.toFormat('LL')

        mkdirSync(`./public/currencies/${year}/${month}`, { recursive: true })
        writeFileSync(`./public/currencies/${year}/${month}/${loadedRate.quoteCurrency}.json`, JSON.stringify({
            month: startDate.toFormat('yyyy-LL'),
            currency: loadedRate.quoteCurrency,
            rates: loadedRate.data.sort((i1, i2) => i1[0] - i2[0]).map(i => Number.parseFloat(i[1]))
        }))
    }
}

void load()
