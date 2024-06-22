import { Box, Paper, Typography, useMediaQuery, useTheme } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'

import { CurrenciesLoader } from '../../../currencies/currencies'
import { CustomTimeSpan, LastPeriodTimeSpan } from '../../../engine/dates'
import { NotDeletedOperation } from '../../../engine/model'
import { compilePredicate, PE, Predicate } from '../../../engine/predicateExpression'
import { TotalAndChangeStats } from '../../../engine/stats/model'
import { calcStats2, StatsReducer } from '../../../engine/stats/newStatsProcessor'
import { TotalAndChangeReducer } from '../../../engine/stats/TotalAndChangeReducer'
import { YMComparisonReducer } from '../../../engine/stats/YMComparisonReducer'
import { formatCurrency } from '../../helpers/currencies'
import { runAsync } from '../../helpers/smallTools'
import { useFrontState } from '../../model/FrontState'
import { useCurrenciesLoader } from '../../useCurrenciesLoader'
import { useEngine } from '../../useEngine'
import { DivBody2 } from '../generic/Typography'
import { YMExpensesComparisonPlot } from '../plots/YMComparisonPlot'
import { ExpensesInfoTable } from './ExpensesInfoTable'
import { ExpensesBarsPlot, ExpensesTotalPlot } from './ExpensesPlots'

interface Props {
    currency: string
    perDayGoal: number | null
    predicate: Predicate
}

interface Stats {
    lastMonth: number
    last3Month: number
    lastYear: number
    monthsComparison: YMComparisonReducer
    periodStats: TotalAndChangeStats
}

export const ExpensesStatsWidget = observer(({ currency, predicate, perDayGoal }: Props): ReactElement => {
    const engine = useEngine()
    const appState = useFrontState()
    const currenciesLoader = useCurrenciesLoader()

    const theme = useTheme()
    const xs = useMediaQuery(theme.breakpoints.down('sm'))

    const [stats, setStats] = useState<Stats | null>(null)

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    useEffect(
        () => {
            runAsync(async () => {
                const today = appState.today
                const timeSpan = appState.timeSpan

                const filter = compilePredicate(predicate, engine)

                const reducer = new LastPeriodStatsReducer(filter, currenciesLoader, currency)

                const mc = new YMComparisonReducer(currenciesLoader, currency)
                const ts = new CustomTimeSpan(
                    DateTime.utc().minus({ years: 4 }).startOf('year'),
                    today
                )
                await calcStats2(engine, predicate, ts, today, [mc, reducer])

                const changeStats = new TotalAndChangeReducer(engine, currenciesLoader, today, timeSpan, predicate, currency)
                await calcStats2(engine, PE.any(), timeSpan, today, [changeStats])

                setStats({
                    lastMonth: reducer.lastMonth,
                    last3Month: reducer.last3Month,
                    lastYear: reducer.lastYear,
                    monthsComparison: mc,
                    periodStats: changeStats.stats
                })
            })
        },
        [
            currency,
            predicate,
            appState.today,
            appState.timeSpanInfo,
            engine.operations,
            xs
        ]
    )

    if (stats === null) {
        return <></>
    }

    const timeSpan = appState.timeSpan
    const today = appState.today
    const daysLeft = timeSpan.daysLeft(today)
    const totalDays = timeSpan.totalDays
    const totalAmount = stats.periodStats.total

    const leftPerDay = perDayGoal === null || daysLeft === 0
        ? null
        : (perDayGoal * totalDays + totalAmount - stats.periodStats.todayChange) / daysLeft

    const perDay = totalDays - daysLeft === 0
        ? null
        : -(totalAmount) / (totalDays - daysLeft + (timeSpan.includesDate(today) ? 1 : 0))

    return (
        <Box display={'flex'} flexDirection={'column'} gap={1} pb={1}>
            <DivBody2 mt={1} py={1}>
                <ExpensesInfoTable currency={currency} periodPace={perDay === null ? null : perDay * 30} leftPerDay={leftPerDay} />
            </DivBody2>
            <Paper variant={'outlined'} sx={{ p: 1 }}>
                <Typography variant={'h6'} textAlign={'center'}>
                    {'Avg. Pace (30d)'}
                </Typography>
                <Box display={'flex'} mb={1}>
                    <Typography variant={'body2'} textAlign={'center'} flex={'1 1 0'} noWrap minWidth={0}>
                        {'1 month'}
                        <br />
                        {cur(stats.lastMonth, true)}
                    </Typography>
                    <Typography variant={'body2'} textAlign={'center'} flex={'1 1 0'} noWrap minWidth={0}>
                        {'3 month'}
                        <br />
                        {cur(stats.last3Month, true)}
                    </Typography>
                    <Typography variant={'body2'} textAlign={'center'} flex={'1 1 0'} noWrap minWidth={0}>
                        {'1 year'}
                        <br />
                        {cur(stats.lastYear, true)}
                    </Typography>
                </Box>
            </Paper>
            <ExpensesBarsPlot
                currency={currency}
                stats={stats.periodStats}
                perDay={perDay}
                perDayGoal={perDayGoal}
                leftPerDay={leftPerDay}
                daysLeft={daysLeft}
                today={today}
            />
            <ExpensesTotalPlot
                currency={currency}
                perDayGoal={perDayGoal === null ? null : [perDayGoal, currency]}
                expenses={stats.periodStats.dayTotal.map(i => i.value)}
            />
            <YMExpensesComparisonPlot
                title={'Y/M Comparison'}
                stats={stats.monthsComparison.expenses}
                currency={currency}
            />
        </Box>
    )
})

class LastPeriodStatsReducer extends StatsReducer {
    private readonly lastYearPeriod = new LastPeriodTimeSpan({ year: 1 })
    private readonly lastMonthPeriod = new LastPeriodTimeSpan({ month: 1 })
    private readonly last3MonthPeriod = new LastPeriodTimeSpan({ month: 3 })

    private filter: (op: NotDeletedOperation) => boolean
    private currenciesLoader: CurrenciesLoader
    private currency: string

    lastYear = 0
    last3Month = 0
    lastMonth = 0

    constructor(filter: (op: NotDeletedOperation) => boolean, currenciesLoader: CurrenciesLoader, currency: string) {
        super()
        this.filter = filter
        this.currenciesLoader = currenciesLoader
        this.currency = currency
    }

    async process(op: NotDeletedOperation): Promise<void> {
        if (
            (
                op.type !== 'expense'
                && (op.type !== 'income' || op.categories.length === 0)
            )
            || op.date < this.lastYearPeriod.startDate
        ) {
            return
        }

        const rate = await this.currenciesLoader.getRate(op.date, op.currency, this.currency)

        let amount = 0
        for (const cat of op.categories) {
            const catOp = { ...op, categories: [cat] }

            if (!this.filter(catOp)) {
                continue
            }

            amount += cat.amount * rate
        }

        this.lastYear += amount

        if (op.date >= this.last3MonthPeriod.startDate) {
            this.last3Month += amount
        }

        if (op.date >= this.lastMonthPeriod.startDate) {
            this.lastMonth += amount
        }
    }

    async done(): Promise<void> {
        this.lastMonth = -30 * this.lastMonth / this.lastMonthPeriod.totalDays
        this.last3Month = -30 * this.last3Month / this.last3MonthPeriod.totalDays
        this.lastYear = -30 * this.lastYear / this.lastYearPeriod.totalDays
    }
}
