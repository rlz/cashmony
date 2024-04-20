import { Box, Paper, styled, Typography, useMediaQuery, useTheme } from '@mui/material'
import * as Plot from '@observablehq/plot'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import { match, P } from 'ts-pattern'

import { formatCurrency } from '../../helpers/currencies'
import { CustomTimeSpan, LastPeriodTimeSpan } from '../../helpers/dates'
import { runAsync } from '../../helpers/smallTools'
import { AppState } from '../../model/appState'
import { calcStats2 } from '../../model/newStatsProcessor'
import { OperationsModel } from '../../model/operations'
import { type Predicate } from '../../model/predicateExpression'
import { calcStats } from '../../model/stats'
import { MonthComparison } from '../../model/stats/monthsComparison'
import { cumulativeIntervalExpensesReducer, perIntervalExpensesReducer, periodExpensesReducer } from '../../model/statsReducers'
import { DivBody2, Italic } from '../generic/Typography'
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
    monthsComparison: {
        expenses: readonly Record<number, number>[]
        incomes: readonly Record<number, number>[]
    }
}

export const ExpensesStatsWidget = observer(({ currency, predicate, perDayGoal }: Props): ReactElement => {
    const appState = AppState.instance()
    const operationsModel = OperationsModel.instance()

    const theme = useTheme()
    const xs = useMediaQuery(theme.breakpoints.down('sm'))

    const [stats, setStats] = useState<Stats | null>(null)

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    useEffect(
        () => {
            if (
                operationsModel.operations === null
            ) {
                return
            }

            runAsync(async () => {
                const periodStats = await calcStats(predicate, appState.timeSpan, appState.today, {
                    total: cumulativeIntervalExpensesReducer('day', predicate, currency),
                    today: periodExpensesReducer(appState.today, predicate, currency),
                    perDay: perIntervalExpensesReducer('day', predicate, currency)
                })

                const lastYear = new LastPeriodTimeSpan({ year: 1 })
                const lastMonth = new LastPeriodTimeSpan({ month: 1 })
                const last3Month = new LastPeriodTimeSpan({ month: 3 })

                const yearStats = await calcStats(predicate, lastYear, appState.today, {
                    lastMonth: periodExpensesReducer(lastMonth.startDate, predicate, currency),
                    last3Month: periodExpensesReducer(last3Month.startDate, predicate, currency),
                    lastYear: periodExpensesReducer(lastYear.startDate, predicate, currency)
                })

                const mc = new MonthComparison(currency)
                const ts = new CustomTimeSpan(
                    DateTime.utc().minus({ years: xs ? 2 : 4 }).startOf('year'),
                    DateTime.utc()
                )
                await calcStats2(predicate, ts, appState.today, [mc])

                setStats({
                    total: periodStats.total[periodStats.total.length - 1],
                    today: periodStats.today[0],
                    perDay: periodStats.perDay,
                    cumulative: periodStats.total,
                    lastMonth: -30 * yearStats.lastMonth[0] / lastMonth.totalDays,
                    last3Month: -30 * yearStats.last3Month[0] / last3Month.totalDays,
                    lastYear: -30 * yearStats.lastYear[0] / lastYear.totalDays,
                    monthsComparison: {
                        expenses: mc.expenses,
                        incomes: mc.incomes
                    }
                })
            })
        },
        [
            currency,
            predicate,
            appState.today,
            appState.timeSpanInfo,
            operationsModel.operations,
            xs
        ]
    )

    if (stats === null) {
        return <></>
    }

    const timeSpan = appState.timeSpan
    const daysLeft = appState.daysLeft
    const totalDays = timeSpan.totalDays

    const leftPerDay = perDayGoal === null || daysLeft === 0
        ? null
        : (perDayGoal * totalDays + stats.total - stats.today) / daysLeft

    const periodPace = totalDays - daysLeft === 0
        ? null
        : (stats.total - stats.today) * 30 / (totalDays - daysLeft)

    return <Box display={'flex'} flexDirection={'column'} gap={1} pb={1}>
        <DivBody2 mt={1} py={1}>
            <table className={'stats'}>
                <tbody>
                    <tr>
                        <th>{'Period pace (30d):'}</th>
                        <td>{match(periodPace).with(null, () => '-').otherwise(v => cur(-v))}</td>
                    </tr>
                    <tr>
                        <th>{'Left per day:'}</th>
                        <td>
                            {
                                match(leftPerDay)
                                    .with(null, () => '-')
                                    .with(P.number.gt(0), v => cur(v))
                                    .otherwise(() => <Italic variant={'body2'} color={'warning.main'}>{'overspend'}</Italic>)
                            }
                        </td>
                    </tr>
                </tbody>
            </table>
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
            perDayPace={periodPace === null ? null : periodPace / 30}
            perDayExpenses={stats.perDay}
        />
        <ExpensesTotalPlot
            currency={currency}
            perDayGoal={perDayGoal === null ? null : [perDayGoal, currency]}
            expenses={stats.cumulative}
        />
        <MonthComparisonPlot expenses={stats.monthsComparison.expenses} currency={currency} />
    </Box>
})

interface PlotProps {
    expenses: readonly Record<number, number>[]
    currency: string
}

const PlotContainer = styled('div')(
    {
        '&': {
            figure: {
                margin: 0
            }
        }
    }
)

function MonthComparisonPlot({ expenses, currency }: PlotProps): JSX.Element {
    const { width, ref } = useResizeDetector()

    const data = useMemo(() => {
        return expenses.map((e, i) => { return { month: i, perYear: e } })
            .flatMap(({ month, perYear }) => {
                return Object.entries(perYear).map(([year, amount]) => {
                    return {
                        Year: year,
                        month,
                        amount: -amount
                    }
                })
            })
    }, [expenses])

    useEffect(
        () => {
            if (ref.current == null) {
                return
            }

            const p = Plot.plot({
                width,
                height: 250,
                x: { axis: null, type: 'band' },
                y: { tickFormat: v => formatCurrency(v, currency, true), grid: true, label: 'Total' },
                fx: { label: 'Month' },
                color: { type: 'ordinal', scheme: 'Category10', legend: true },
                marks: [
                    Plot.barY(data, {
                        x: 'Year',
                        y: 'amount',
                        fill: 'Year',
                        fx: 'month'
                        // tip: {
                        //     format: {
                        //         fx: false,
                        //         y: v => formatCurrency(v, currency)
                        //     }
                        // }
                    }),
                    Plot.ruleY([0]),
                    Plot.axisFx({
                        label: null,
                        anchor: 'bottom',
                        tickFormat: monthFormat
                    })
                ]
            })
            ref.current.append(p)

            return () => {
                p.remove()
            }
        },
        [width, expenses]
    )

    return <Paper variant={'outlined'}>
        <Box p={1}>
            <Typography variant={'h6'} textAlign={'center'}>{'Monthly'}</Typography>
            <PlotContainer ref={ref} />
        </Box>
    </Paper>
}

function monthFormat(month: number): string {
    return ['Jan', 'Feb', 'Mar',
        'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep',
        'Oct', 'Nov', 'Dec'][month]
}
