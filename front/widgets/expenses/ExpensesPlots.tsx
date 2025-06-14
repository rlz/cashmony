import { Box, Paper, SxProps, Typography, useTheme } from '@mui/material'
import * as Plot from '@observablehq/plot'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect } from 'react'
import { useResizeDetector } from 'react-resize-detector'

import { TotalAndChangeStats } from '../../../engine/stats/model'
import { formatCurrency } from '../../helpers/currencies'
import { PlotContainer } from '../plots/PlotUtils'

interface ExpensesBarsPlotProps {
    stats: TotalAndChangeStats
    perDay: number | null
    leftPerDay: number | null
    perDayGoal: number | null
    daysLeft: number
    sparkline?: boolean
}

const sxHeight50: SxProps = { height: '50px' }
const sxHeight250: SxProps = { height: '250px' }

export const ExpensesBarsPlot = observer(({ stats, perDay, leftPerDay, perDayGoal, daysLeft, sparkline }: ExpensesBarsPlotProps): ReactElement => {
    sparkline ??= false
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

            const p = Plot.plot({
                width,
                height: sparkline ? 50 : 250,
                x: {
                    type: 'utc',
                    grid: !sparkline,
                    axis: sparkline ? null : undefined
                },
                y: {
                    tickFormat: v => formatCurrency(v, stats.currency, true),
                    grid: !sparkline,
                    label: null,
                    axis: sparkline ? null : undefined,
                    domain: stats.dayTotal.every(i => i.value === 0) ? [0, 1] : undefined
                },
                marks: [
                    Plot.rectY(barData, {
                        y: ({ value }) => Math.abs(value),
                        x: 'date',
                        interval,
                        fill: ({ value }) => value >= 0 ? theme.palette.success.main : theme.palette.error.main }
                    ),
                    Plot.lineY(
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
                    Plot.areaY(
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
                                Plot.lineY(
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
                                Plot.areaY(
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
                                Plot.lineY(
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
        [width, stats]
    )

    return sparkline
        ? <PlotContainer ref={ref} sx={sxHeight50} />
        : (
                <Paper variant={'outlined'}>
                    <Box p={1}>
                        <Typography variant={'h6'} textAlign={'center'}>{'Stats'}</Typography>
                        <PlotContainer ref={ref} sx={sxHeight250} />
                    </Box>
                </Paper>
            )
})

interface TotalCatPlotProps {
    perDayGoal: number | null
    stats: TotalAndChangeStats
}

export const ExpensesTotalPlot = observer(({ stats, perDayGoal }: TotalCatPlotProps): ReactElement => {
    const { width, ref } = useResizeDetector()
    const theme = useTheme()

    useEffect(
        () => {
            if (ref.current == null) {
                return
            }

            const startDate = stats.dayTotal[0].date
            const endDate = stats.dayTotal.at(-1)!.date
            const totalDays = stats.timeSpan.totalDays
            const daysLeft = stats.timeSpan.daysLeft(stats.today) - (stats.timeSpan.includesDate(stats.today) ? 1 : 0)

            const extrapolatedTotal = stats.total * totalDays / (totalDays - daysLeft)

            const p = Plot.plot({
                width,
                height: 250,
                x: {
                    type: 'utc',
                    grid: true
                },
                y: {
                    tickFormat: v => formatCurrency(v, stats.currency, true),
                    grid: true,
                    label: null,
                    domain: [0, Math.max(-extrapolatedTotal, (perDayGoal ?? 0) * totalDays)]
                },
                marks: [
                    Plot.lineY(
                        stats.dayTotal,
                        {
                            y: ({ value }) => -value,
                            x: 'date',
                            filter: ({ date }) => date <= stats.today,
                            stroke: theme.palette.primary.main
                        }
                    ),
                    Plot.areaY(
                        stats.dayTotal,
                        {
                            y: ({ value }) => -value,
                            x: 'date',
                            filter: ({ date }) => date <= stats.today,
                            fill: theme.palette.primary.main,
                            fillOpacity: 0.2
                        }
                    )
                ].values()
                    .concat(daysLeft > 0
                        ? [
                                Plot.lineY(
                                    [
                                        { v: -stats.total, d: stats.today },
                                        { v: -extrapolatedTotal, d: endDate }
                                    ],
                                    {
                                        x: 'd',
                                        y: 'v',
                                        stroke: theme.palette.primary.main,
                                        strokeDasharray: '4 3'
                                    }
                                )
                            ]
                        : []
                    )
                    .concat(perDayGoal !== null
                        ? [
                                Plot.lineY(
                                    [
                                        { v: perDayGoal, d: startDate },
                                        { v: perDayGoal * (totalDays - daysLeft), d: daysLeft === 0 ? endDate : stats.today }
                                    ],
                                    {
                                        x: 'd',
                                        y: 'v',
                                        stroke: theme.palette.info.main
                                    }
                                )
                            ]
                        : []
                    )
                    .concat(daysLeft > 0 && perDayGoal !== null
                        ? [
                                Plot.lineY(
                                    [
                                        { v: perDayGoal * (totalDays - daysLeft), d: stats.today },
                                        { v: perDayGoal * totalDays, d: endDate }
                                    ],
                                    {
                                        x: 'd',
                                        y: 'v',
                                        stroke: theme.palette.info.main,
                                        strokeDasharray: '4 3'
                                    }
                                ),
                                Plot.areaY(
                                    [
                                        { v: perDayGoal * (totalDays - daysLeft), d: stats.today },
                                        { v: perDayGoal * totalDays, d: endDate }
                                    ],
                                    {
                                        x: 'd',
                                        y: 'v',
                                        fill: theme.palette.info.main,
                                        fillOpacity: 0.2
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
        [width, stats]
    )

    return (
        <Paper variant={'outlined'}>
            <Box p={1}>
                <Typography variant={'h6'} textAlign={'center'}>{'Total'}</Typography>
                <PlotContainer ref={ref} sx={sxHeight250} />
            </Box>
        </Paper>
    )
})
