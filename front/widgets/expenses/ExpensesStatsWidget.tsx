import { Box, Paper, Typography, useMediaQuery, useTheme } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'

import { CustomTimeSpan, LastPeriodTimeSpan } from '../../../engine/dates'
import { Predicate } from '../../../engine/predicateExpression'
import { calcStats } from '../../../engine/stats'
import { calcStats2 } from '../../../engine/stats/newStatsProcessor'
import { YMComparisonReducer } from '../../../engine/stats/YMComparisonReducer'
import { cumulativeIntervalExpensesReducer, perIntervalExpensesReducer, periodExpensesReducer } from '../../../engine/statsReducers'
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
    total: number
    today: number
    perDay: number[]
    cumulative: number[]
    lastMonth: number
    last3Month: number
    lastYear: number
    monthsComparison: YMComparisonReducer
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
                const periodStats = await calcStats(engine, predicate, appState.timeSpan, appState.today, {
                    total: cumulativeIntervalExpensesReducer(engine, currenciesLoader, 'day', predicate, currency),
                    today: periodExpensesReducer(engine, currenciesLoader, appState.today, predicate, currency),
                    perDay: perIntervalExpensesReducer(engine, currenciesLoader, 'day', predicate, currency)
                })

                const lastYear = new LastPeriodTimeSpan({ year: 1 })
                const lastMonth = new LastPeriodTimeSpan({ month: 1 })
                const last3Month = new LastPeriodTimeSpan({ month: 3 })

                const yearStats = await calcStats(engine, predicate, lastYear, appState.today, {
                    lastMonth: periodExpensesReducer(engine, currenciesLoader, lastMonth.startDate, predicate, currency),
                    last3Month: periodExpensesReducer(engine, currenciesLoader, last3Month.startDate, predicate, currency),
                    lastYear: periodExpensesReducer(engine, currenciesLoader, lastYear.startDate, predicate, currency)
                })

                const mc = new YMComparisonReducer(currenciesLoader, currency)
                const ts = new CustomTimeSpan(
                    DateTime.utc().minus({ years: 4 }).startOf('year'),
                    DateTime.utc()
                )
                await calcStats2(engine, predicate, ts, appState.today, [mc])

                setStats({
                    total: periodStats.total[periodStats.total.length - 1],
                    today: periodStats.today[0],
                    perDay: periodStats.perDay,
                    cumulative: periodStats.total,
                    lastMonth: -30 * yearStats.lastMonth[0] / lastMonth.totalDays,
                    last3Month: -30 * yearStats.last3Month[0] / last3Month.totalDays,
                    lastYear: -30 * yearStats.lastYear[0] / lastYear.totalDays,
                    monthsComparison: mc
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
    const daysLeft = timeSpan.daysLeft(appState.today)
    const totalDays = timeSpan.totalDays

    const leftPerDay = perDayGoal === null || daysLeft === 0
        ? null
        : (perDayGoal * totalDays + stats.total - stats.today) / daysLeft

    // avg expenses per 30 days, positive value
    const periodPace = totalDays - daysLeft === 0
        ? null
        // exclude 'today' expences
        : -(stats.total - stats.today) * 30 / (totalDays - daysLeft)

    return (
        <Box display={'flex'} flexDirection={'column'} gap={1} pb={1}>
            <DivBody2 mt={1} py={1}>
                <ExpensesInfoTable currency={currency} periodPace={periodPace} leftPerDay={leftPerDay} />
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
                leftPerDay={leftPerDay}
                perDayPace={periodPace === null ? null : -periodPace / 30}
                perDayExpenses={stats.perDay}
            />
            <ExpensesTotalPlot
                currency={currency}
                perDayGoal={perDayGoal === null ? null : [perDayGoal, currency]}
                expenses={stats.cumulative}
            />
            <YMExpensesComparisonPlot
                title={'Y/M Comparison'}
                stats={stats.monthsComparison.expenses}
                currency={currency}
            />
        </Box>
    )
})
