import { useTheme } from '@mui/material'
import React, { useMemo, type ReactElement } from 'react'
import { AppState } from '../model/appState'
import { observer } from 'mobx-react-lite'
import { OperationsModel } from '../model/operations'
import { CategoriesModel } from '../model/categories'
import { type ExpensesStats } from '../model/stats'
import { Plot, type PlotSeries } from './Plot'
import { utcToday } from '../helpers/dates'
import { CurrenciesModel } from '../model/currencies'

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
            if (daysLeft > 0 && stats.yearGoalUsd !== null) {
                const leftPerDay = Math.max(-(stats.leftPerDay(appState.timeSpan, currency) ?? 0), 0)
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
        initialWidth={window.innerWidth - 32}
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
                const daysPass = appState.timeSpan.totalDays - appState.daysLeft
                const periodTotal = -stats.amountTotal(appState.timeSpan, currency)

                series.push({
                    type: 'dash',
                    color: theme.palette.primary.main,
                    points: allDates.map((_, i) => i < daysPass ? undefined : periodTotal * i / daysPass)
                })
            }

            const dayGoalUsd = stats.goalUsd(1)
            if (dayGoalUsd !== null) {
                const today = appState.today
                const dayGoal = dayGoalUsd * currenciesModel.getFromUsdRate(utcToday(), currency)

                series.push(
                    {
                        type: 'line',
                        color: theme.palette.info.main,
                        points: allDates.map((d, i) => d <= today ? -dayGoal * i : null)
                    },
                    {
                        type: 'dash',
                        color: theme.palette.info.main,
                        points: allDates.map((d, i) => d >= today ? -dayGoal * i : null)
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
        initialWidth={window.innerWidth - 32}
        title='Total Amount'
        p={1}
    />
})
