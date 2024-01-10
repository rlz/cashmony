import { mkdirSync, writeFileSync } from 'fs'
import { DateTime } from 'luxon'
import z from 'zod'

import { CURRENCIES } from '../src/helpers/currenciesList'

const YEAR = 2023
const MONTH = 12

const currencies = Object.keys(CURRENCIES).filter(i => i !== 'USD')
const startDate = DateTime.utc(YEAR, MONTH, 1)
const endDate = (() => {
    const d = startDate.plus({ month: 1 }).minus({ days: 1 })
    if (d > DateTime.utc()) return DateTime.utc()
    return d
})()

const RespSchema = z.object({
    usd: z.record(z.number())
})

type Resp = z.infer<typeof RespSchema>

async function loadDate (date: DateTime): Promise<Resp> {
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${date.toFormat('yyyy-LL-dd')}/currencies/usd.json`

    const result = await fetch(url)

    if (!result.ok) {
        throw Error(`Not ok resp (${result.status} ${result.statusText}) for ${url}`)
    }

    return RespSchema.parse(await result.json())
}

async function load (): Promise<void> {
    const rates: Record<string, number[]> = {}
    for (const c of currencies) {
        rates[c] = []
    }

    const tasks: Array<Promise<() => void>> = []

    for (let d = startDate; d <= endDate; d = d.plus({ days: 1 })) {
        tasks.push((async () => {
            const resp = await loadDate(d)
            return () => {
                for (const c of currencies) {
                    rates[c].push(resp.usd[c.toLocaleLowerCase()])
                }
            }
        })())
    }

    for (const t of tasks) {
        (await t)()
    }

    for (const cur of currencies) {
        const year = startDate.toFormat('yyyy')
        const month = startDate.toFormat('LL')

        mkdirSync(`./public/currencies/${year}/${month}`, { recursive: true })
        writeFileSync(`./public/currencies/${year}/${month}/${cur}.json`, JSON.stringify({
            month: startDate.toFormat('yyyy-LL'),
            currency: cur,
            rates: rates[cur]
        }))
    }
}

void load()
