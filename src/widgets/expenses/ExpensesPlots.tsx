import { useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useMemo } from 'react'

import { utcToday } from '../../helpers/dates'
import { AppState } from '../../model/appState'
import { CategoriesModel } from '../../model/categories'
import { CurrenciesModel } from '../../model/currencies'
import { OperationsModel } from '../../model/operations'
import { type ExpensesStats } from '../../model/stats'
import { Plot, type PlotSeries } from '../Plot'

const appState = AppState.instance()
const currenciesModel = CurrenciesModel.instance()
const operationsModel = OperationsModel.instance()
const categoriesModel = CategoriesModel.instance()

interface AmountBarsCatPlotProps {
    currency: string
    stats: ExpensesStats
    sparkline?: boolean
}

export const ExpensesBarsPlot = observer(({ currency, stats, sparkline }: AmountBarsCatPlotProps): ReactElement => {
    const theme = useTheme()

    const series = useMemo(
        () => {
            const allDates = [...appState.timeSpan.allDates({ includeDayBefore: true })]
                .map(d => d.toMillis() / 1000)

            if (operationsModel.operations.length === 0 || categoriesModel.categories.size === 0) {
                return {
                    xvalues: allDates,
                    series: []
                }
            }

            const expensesByDate = [undefined, ...stats.expensesByDate(currency)]
            const perDay = -stats.avgUntilToday(1, appState.timeSpan, currency)

            const series: PlotSeries[] = [
                {
                    type: 'bars',
                    color: theme.palette.error.main,
                    points: expensesByDate.map(a => a === undefined || a >= 0 ? null : -a)
                },
                {
                    type: 'bars',
                    color: theme.palette.success.main,
                    points: expensesByDate.map(a => a === undefined || a <= 0 ? null : a)
                },
                {
                    type: 'line',
                    color: theme.palette.info.main,
                    points: expensesByDate.map((a, i) => a !== undefined || i === 0 ? perDay : null)
                }
            ]

            const daysLeft = appState.daysLeft
            if (daysLeft > 0 && stats.perDayGoal !== null) {
                const leftPerDay = Math.max(-(stats.leftPerDay(appState.timeSpan, currency)?.value ?? 0), 0)
                series.push({
                    type: 'dash',
                    color: theme.palette.info.main,
                    points: expensesByDate.map((_, i, a) => a[i + 1] === undefined ? leftPerDay : null)
                })
            }

            return {
                xvalues: allDates,
                series
            }
        },
        [
            stats.operations,
            appState.timeSpanInfo,
            appState.today,
            operationsModel.operations,
            categoriesModel.categories
        ]
    )

    return <Plot
        elevation={sparkline === true ? 0 : 2}
        showAxes={sparkline !== true}
        currency={currency}
        height={sparkline === true ? 50 : 150}
        xvalues={series.xvalues}
        series={series.series}
        title={sparkline === true ? undefined : 'Daily Amount'}
        p={sparkline === true ? 0 : 1}
    />
})

interface TotalCatPlotProps {
    currency: string
    stats: ExpensesStats
}

export const ExpensesTotalPlot = observer(({ currency, stats }: TotalCatPlotProps): ReactElement => {
    const theme = useTheme()

    const series = useMemo(
        () => {
            const allDates = [...appState.timeSpan.allDates({ includeDayBefore: true })]

            if (operationsModel.operations.length === 0 || categoriesModel.categories.size === 0) {
                return {
                    xvalues: allDates.map(d => d.toMillis() / 1000),
                    series: []
                }
            }

            const totalExpensesByDates = [0, ...stats.totalExpensesByDates(currency)].map(a => a === undefined ? a : -a)

            const series: PlotSeries[] = [{
                type: 'line',
                color: theme.palette.primary.main,
                points: totalExpensesByDates
            }]

            if (appState.daysLeft > 0) {
                const daysPass = appState.timeSpan.totalDays - appState.daysLeft + 1
                const periodTotal = -stats.amountTotal(appState.timeSpan, currency)

                series.push({
                    type: 'dash',
                    color: theme.palette.primary.main,
                    points: allDates.map((_, i) => i < daysPass ? undefined : periodTotal * i / daysPass)
                })
            }

            const dayGoal = stats.goal(1)
            if (dayGoal !== null) {
                const today = appState.today
                const dayGoalInDestCur = dayGoal.value * currenciesModel.getRate(utcToday(), dayGoal.currency, currency)

                series.push(
                    {
                        type: 'line',
                        color: theme.palette.info.main,
                        points: allDates.map((d, i) => d <= today ? -dayGoalInDestCur * i : null)
                    },
                    {
                        type: 'dash',
                        color: theme.palette.info.main,
                        points: allDates.map((d, i) => d >= today ? -dayGoalInDestCur * i : null)
                    }
                )
            }

            return {
                xvalues: allDates.map(d => d.toMillis() / 1000),
                series
            }
        },
        [
            stats.operations,
            appState.timeSpanInfo,
            appState.today,
            operationsModel.operations,
            categoriesModel.categories
        ]
    )

    return <Plot
        elevation={2}
        showAxes={true}
        currency={currency}
        height={250}
        xvalues={series.xvalues}
        series={series.series}
        title={'Total Amount'}
        p={1}
    />
})
