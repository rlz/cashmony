import { useTheme } from '@mui/material'
import React, { useMemo, type ReactElement } from 'react'
import { type CategoryStats } from '../model/stats'
import uPlot from 'uplot'
import { AppState } from '../model/appState'
import { observer } from 'mobx-react-lite'
import { OperationsModel } from '../model/operations'
import { CategoriesModel } from '../model/categories'
import { ResizeableUplot, type UplotData, type UplotOptions } from './ResizeableUplot'
import { formatCurrency } from '../helpers/currencies'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()
const categoriesModel = CategoriesModel.instance()

interface AmountBarsCatPlotProps {
    stats: CategoryStats
    sparkline?: boolean
}

export const AmountBarsCatPlot = observer(({ stats, sparkline }: AmountBarsCatPlotProps): ReactElement => {
    const theme = useTheme()

    const uPlotGraphs = useMemo(
        () => {
            const allDates = [...appState.timeSpan.allDates({ includeDayBefore: true })]
            const amountByDate = [undefined, ...stats.amountByDate()]
            const perDay = -stats.avgUntilToday(1)

            const data: UplotData = [
                allDates.map(d => d.toMillis() / 1000),
                amountByDate.map(a => a === undefined || a >= 0 ? null : -a),
                amountByDate.map(a => a === undefined || a <= 0 ? null : a),
                amountByDate.map((a, i) => a !== undefined || i === 0 ? perDay : null)
            ]

            const bars = uPlot.paths.bars

            if (bars === undefined) {
                throw Error('bars expected here')
            }

            const series: uPlot.Series[] = [
                {},
                {
                    stroke: theme.palette.error.main,
                    fill: theme.palette.error.main,
                    points: { show: false },
                    paths: bars({ size: [0.5], align: -1 })
                },
                {
                    stroke: theme.palette.success.main,
                    fill: theme.palette.success.main,
                    points: { show: false },
                    paths: bars({ size: [0.5], align: -1 })
                },
                {
                    stroke: theme.palette.info.main,
                    points: { show: false }
                }
            ]

            const daysLeft = stats.daysLeft()
            if (daysLeft > 0 && stats.category.yearGoal !== undefined) {
                const leftPerDay = Math.max(-(stats.leftPerDay() ?? 0), 0)
                data.push(
                    amountByDate.map((_, i, a) => a[i + 1] === undefined ? leftPerDay : null)
                )
                series.push({
                    stroke: theme.palette.info.main,
                    points: { show: false },
                    dash: [10, 3]
                })
            }

            return { data, series }
        },
        [
            stats.category.name,
            appState.timeSpanInfo,
            appState.today,
            operationsModel.operations,
            categoriesModel.categories
        ]
    )

    const opts: UplotOptions = {
        height: sparkline === true ? 50 : 150,
        axes: [
            {
                stroke: 'white',
                show: sparkline !== true,
                grid: {
                    show: true,
                    stroke: '#444',
                    width: 1
                }
            },
            {
                stroke: 'white',
                show: sparkline !== true,
                values: (_, vals) => vals.map(v => formatCurrency(v, stats.category.currency, true)),
                grid: {
                    show: true,
                    stroke: '#444',
                    width: 1
                }
            }
        ],
        series: uPlotGraphs.series
    }

    return <ResizeableUplot
        data={uPlotGraphs.data}
        opts={opts}
        initialWidth={window.innerWidth - 32}
        title={sparkline === true ? undefined : 'Daily Amount'}
        p={sparkline === true ? 0 : 1}
    />
})

export const TotalCatPlot = observer(({ stats }: { stats: CategoryStats }): ReactElement => {
    const theme = useTheme()

    const uPlotGraphs = useMemo(
        () => {
            const allDates = [...appState.timeSpan.allDates({ includeDayBefore: true })]
            const cumulativeAmountByDates = [0, ...stats.totalAmountByDates()].map(a => a === undefined ? a : -a)

            const data: UplotData = [
                allDates.map(d => d.toMillis() / 1000),
                cumulativeAmountByDates
            ]

            const series: uPlot.Series[] = [
                {},
                {
                    stroke: theme.palette.primary.main,
                    points: {
                        show: false
                    }
                }
            ]

            if (stats.daysLeft() > 0) {
                const daysPass = stats.daysTotal() - stats.daysLeft()
                const periodTotal = -stats.amountTotal()

                data.push(
                    allDates.map((_, i) => i < daysPass ? undefined : periodTotal * i / daysPass)
                )
                series.push(
                    {
                        stroke: theme.palette.primary.main,
                        dash: [10, 3],
                        points: {
                            show: false
                        }
                    }
                )
            }

            const dayGoal = stats.goal(1)
            if (dayGoal !== null) {
                const today = appState.today

                data.push(
                    allDates.map((d, i) => d <= today ? -dayGoal * i : null),
                    allDates.map((d, i) => d >= today ? -dayGoal * i : null)
                )

                series.push(
                    {
                        stroke: theme.palette.info.main,
                        points: {
                            show: false
                        }
                    },
                    {
                        stroke: theme.palette.info.main,
                        dash: [10, 3],
                        points: {
                            show: false
                        }
                    }

                )
            }

            return { data, series }
        },
        [
            stats.category.name,
            appState.timeSpanInfo,
            appState.today,
            operationsModel.operations,
            categoriesModel.categories
        ]
    )

    const opts: UplotOptions = {
        height: 250,
        axes: [
            {
                stroke: 'white',
                grid: {
                    show: true,
                    stroke: '#444',
                    width: 1
                }
            },
            {
                stroke: 'white',
                values: (_, vals) => vals.map(v => formatCurrency(v, stats.category.currency, true)),
                grid: {
                    show: true,
                    stroke: '#444',
                    width: 1
                }
            }
        ],
        series: uPlotGraphs.series
    }

    return <ResizeableUplot
        data={uPlotGraphs.data}
        opts={opts}
        initialWidth={window.innerWidth - 32}
        title='Total Amount'
        p={1}
    />
})
