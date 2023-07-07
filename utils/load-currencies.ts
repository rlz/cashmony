import { mkdirSync, writeFileSync } from 'fs'
import { DateTime } from 'luxon'
import z from 'zod'

import makeUrl from '../src/google/makeUrl'
import { CURRENCIES } from '../src/helpers/currenciesList'

const currencies = Object.keys(CURRENCIES).filter(i => i !== 'USD')
const startDate = DateTime.utc(2000, 1, 1)
const endDate = DateTime.utc().minus({ day: 1 })

const FcaRespSchema = z.object({
    data: z.record(
        z.record(
            z.union([z.number(), z.undefined()])
        )
    )
})

type FcaResp = z.infer<typeof FcaRespSchema>

async function loadInterval (from: DateTime, to: DateTime): Promise<FcaResp> {
    const url = makeUrl('https://api.freecurrencyapi.com/v1/historical', {
        base: 'USD',
        apikey: '2Z1eMgswOcCdCzkeKTPO5MwYDPWHjcy9wPF7fuOo',
        date_from: from.toISODate() ?? '',
        date_to: to.toISODate() ?? ''
    })
    const result = await fetch(url)

    if (!result.ok) {
        throw Error(`Not ok resp (${result.status} ${result.statusText}) for ${url}`)
    }

    return FcaRespSchema.parse(await result.json())
}

function makeCurrenciesRates (): Record<string, number[]> {
    const rates: Record<string, number[]> = {}
    for (const cur of currencies) {
        rates[cur] = []
    }
    return rates
}

async function loadIntervals (...intervals: Array<[DateTime, DateTime]>): Promise<Record<string, number[]>> {
    const dateCurRateRecord: Record<string, Record<string, number | undefined>> = {}

    for (const jsonPromise of intervals.map(async i => await loadInterval(i[0], i[1]))) {
        const json = await jsonPromise
        for (const date in json.data) {
            dateCurRateRecord[date] = json.data[date]
        }
    }

    const curRateRecord = makeCurrenciesRates()

    for (let d = startDate; d <= endDate; d = d.plus({ day: 1 })) {
        for (const cur of currencies) {
            const rates = curRateRecord[cur]
            const rate = dateCurRateRecord[d.toISODate() ?? ''][cur]
            rates.push(rate !== undefined ? rate : rates[rates.length - 1])
        }
    }

    return curRateRecord
}

async function load (): Promise<void> {
    const intervals: Array<[DateTime, DateTime]> = []

    for (let d = startDate; d <= endDate; d = d.plus({ days: 300 })) {
        const end = d.plus({ days: 299 })
        intervals.push([d, end < endDate ? end : endDate])
    }

    const allRates = await loadIntervals(...intervals)

    for (let m = startDate; m <= endDate; m = m.plus({ month: 1 })) {
        let last = m.plus({ month: 1 }).minus({ day: 1 })
        if (last > endDate) {
            last = endDate
        }

        const monthRates = makeCurrenciesRates()

        for (let d = m; d <= last; d = d.plus({ day: 1 })) {
            const index = d.diff(startDate, 'days').days
            for (const cur of currencies) {
                monthRates[cur].push(allRates[cur][index])
            }
        }

        for (const cur of currencies) {
            const year = m.toFormat('yyyy')
            const month = m.toFormat('LL')

            mkdirSync(`./public/currencies/${year}/${month}`, { recursive: true })
            writeFileSync(`./public/currencies/${year}/${month}/${cur}.json`, JSON.stringify({
                month: m.toFormat('yyyy-LL'),
                currency: cur,
                rates: monthRates[cur]
            }))
        }
    }
}

void load()
