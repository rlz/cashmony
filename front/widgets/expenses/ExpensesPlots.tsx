import { Box, Paper, Typography, useTheme } from '@mui/material'
import * as ObsPlot from '@observablehq/plot'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { useResizeDetector } from 'react-resize-detector'

import { utcToday } from '../../../engine/dates'
import { TotalAndChangeStats } from '../../../engine/stats/model'
import { formatCurrency } from '../../helpers/currencies'
import { runAsync } from '../../helpers/smallTools'
import { useFrontState } from '../../model/FrontState'
import { useCurrenciesLoader } from '../../useCurrenciesLoader'
import { useEngine } from '../../useEngine'
import { Plot, type PlotSeries } from '../Plot'
import { PlotContainer } from '../plots/PlotUtils'

interface ExpensesBarsPlotProps {
    today: DateTime
    stats: TotalAndChangeStats
    perDay: number | null
    leftPerDay: number | null
    perDayGoal: number | null
    daysLeft: number
    currency: string
    sparkline?: boolean
}

export const ExpensesBarsPlot = observer(({ stats, perDay, leftPerDay, perDayGoal, daysLeft, currency, sparkline }: ExpensesBarsPlotProps): ReactElement => {
    sparkline ??= false
    const appState = useFrontState()
    const { width, ref } = useResizeDetector()
    const theme = useTheme()

    useEffect(
        () => {
            if (ref.current == null) {
                return
            }

            const startDate = stats.dayTotal[0].date
            const endDate = stats.dayTotal.at(-1)!.date

            let interval: 'day' | 'week' | 'month' = 'day'
            let barData = stats.dayChange

            if (stats.timeSpan.totalDays > 1095) {
                interval = 'month'
                barData = stats.monthChange.map(({ value, date }) => { return { date, value: value / date.daysInMonth } })
            } else if (stats.timeSpan.totalDays > 180) {
                interval = 'week'
                barData = stats.mWeekChange.map(({ value, date }) => { return { date, value: value / 7 } })
            }

            const p = ObsPlot.plot({
                width,
                height: sparkline ? 50 : 250,
                x: {
                    type: 'utc',
                    grid: !sparkline,
                    axis: sparkline ? null : undefined
                },
                y: {
                    tickFormat: v => formatCurrency(v, currency, true),
                    grid: !sparkline,
                    label: null,
                    axis: sparkline ? null : undefined,
                    domain: stats.dayTotal.every(i => i.value === 0) ? [0, 1] : undefined
                },
                marks: [
                    ObsPlot.rectY(barData, {
                        y: ({ value }) => Math.abs(value),
                        x: 'date',
                        interval,
                        fill: ({ value }) => value >= 0 ? theme.palette.success.main : theme.palette.error.main }
                    ),
                    ObsPlot.lineY(
                        [
                            { v: perDay, d: startDate },
                            { v: perDay, d: (stats.today < endDate ? stats.today : endDate).plus({ day: 1 }) }
                        ],
                        {
                            x: 'd',
                            y: 'v',
                            stroke: theme.palette.primary.main
                        }
                    ),
                    ObsPlot.areaY(
                        [
                            { v: perDay, d: startDate },
                            { v: perDay, d: (stats.today < endDate ? stats.today : endDate).plus({ day: 1 }) }
                        ],
                        {
                            x: 'd',
                            y: 'v',
                            fill: theme.palette.primary.main,
                            fillOpacity: 0.2
                        }
                    )
                ].values()
                    .concat(daysLeft > 0 && leftPerDay !== null && leftPerDay > 0
                        ? [
                                ObsPlot.lineY(
                                    [
                                        { v: leftPerDay, d: stats.today },
                                        { v: leftPerDay, d: endDate.plus({ day: 1 }) }
                                    ],
                                    {
                                        x: 'd',
                                        y: 'v',
                                        stroke: theme.palette.success.main
                                    }
                                ),
                                ObsPlot.areaY(
                                    [
                                        { v: leftPerDay, d: stats.today },
                                        { v: leftPerDay, d: endDate.plus({ day: 1 }) }
                                    ],
                                    {
                                        x: 'd',
                                        y: 'v',
                                        fill: theme.palette.success.main,
                                        fillOpacity: 0.2
                                    }
                                )
                            ]
                        : [])
                    .concat(perDayGoal !== null
                        ? [
                                ObsPlot.lineY(
                                    [
                                        { v: perDayGoal, d: startDate },
                                        { v: perDayGoal, d: endDate.plus({ day: 1 }) }
                                    ],
                                    {
                                        x: 'd',
                                        y: 'v',
                                        stroke: theme.palette.warning.main,
                                        strokeDasharray: '4 3'
                                    }
                                )
                            ]
                        : [])
                    .toArray()
            })
            ref.current.append(p)

            return () => {
                p.remove()
            }
        },
        [width, stats, appState.today]
    )

    return sparkline
        ? <PlotContainer ref={ref} />
        : (
            <Paper variant={'outlined'}>
                <Box p={1}>
                    <Typography variant={'h6'} textAlign={'center'}>{'Stats'}</Typography>
                    <PlotContainer ref={ref} />
                </Box>
            </Paper>
            )
})

interface TotalCatPlotProps {
    currency: string
    perDayGoal: [number, string] | null
    expenses: number[]
}

export const ExpensesTotalPlot = observer((props: TotalCatPlotProps): ReactElement => {
    const appState = useFrontState()
    const currenciesLoader = useCurrenciesLoader()

    const engine = useEngine()
    const theme = useTheme()

    const allDates = useMemo(
        () => [...appState.timeSpan.allDates({ includeDayBefore: true })].map(d => d.toMillis() / 1000),
        [appState.timeSpan]
    )

    const [series, setSeries] = useState<PlotSeries[]>([])

    useEffect(
        () => {
            runAsync(async () => {
                const todaySeconds = appState.today.toMillis() / 1000

                const totalExpensesByDates = [0, ...props.expenses].map((v, i) => allDates[i] > todaySeconds ? undefined : -v)

                const series: PlotSeries[] = [{
                    type: 'line',
                    color: theme.palette.primary.main,
                    points: totalExpensesByDates
                }]

                const daysLeft = appState.timeSpan.daysLeft(appState.today)
                if (daysLeft > 0) {
                    const daysPass = appState.timeSpan.totalDays - daysLeft + 1
                    const periodTotal = -props.expenses[props.expenses.length - 1]

                    series.push({
                        type: 'dash',
                        color: theme.palette.primary.main,
                        points: allDates.map((_, i) => i < daysPass ? undefined : periodTotal * i / daysPass)
                    })
                }

                const dayGoal = props.perDayGoal
                if (dayGoal !== null) {
                    const dayGoalInDestCur = dayGoal[0] * await currenciesLoader.getRate(utcToday(), dayGoal[1], props.currency)

                    series.push(
                        {
                            type: 'line',
                            color: theme.palette.info.main,
                            points: allDates.map((d, i) => d <= todaySeconds ? dayGoalInDestCur * i : null)
                        },
                        {
                            type: 'dash',
                            color: theme.palette.info.main,
                            points: allDates.map((d, i) => d >= todaySeconds ? dayGoalInDestCur * i : null)
                        }
                    )
                }

                setSeries(series)
            })
        },
        [
            appState.today,
            appState.timeSpan,
            engine.operations,
            props.expenses
        ]
    )

    return (
        <Plot
            elevation={2}
            showAxes={true}
            currency={props.currency}
            height={250}
            xvalues={allDates}
            series={series}
            title={'Total Amount'}
            p={1}
        />
    )
})
