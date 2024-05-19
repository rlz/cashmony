import { useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'

import { utcToday } from '../../../engine/dates'
import { runAsync } from '../../helpers/smallTools'
import { useFrontState } from '../../model/FrontState'
import { useCurrenciesLoader } from '../../useCurrenciesLoader'
import { useEngine } from '../../useEngine'
import { Plot, type PlotSeries } from '../Plot'

interface AmountBarsCatPlotProps {
    currency: string
    perDayPace: number | null
    leftPerDay: number | null
    perDayExpenses: number[]
    sparkline?: boolean
}

export const ExpensesBarsPlot = observer((props: AmountBarsCatPlotProps): ReactElement => {
    const appState = useFrontState()
    const engine = useEngine()

    const theme = useTheme()

    const series = useMemo(
        () => {
            const allDates = [...appState.timeSpan.allDates({ includeDayBefore: true })]
                .map(d => d.toMillis() / 1000)

            const todaySeconds = appState.today.toMillis() / 1000

            const series: PlotSeries[] = [
                {
                    type: 'bars',
                    color: theme.palette.error.main,
                    points: [0, ...props.perDayExpenses.map(a => a === undefined || a >= 0 ? null : -a)]
                },
                {
                    type: 'bars',
                    color: theme.palette.success.main,
                    points: [0, ...props.perDayExpenses.map(a => a === undefined || a <= 0 ? null : a)]
                }
            ]

            const perDayPace = props.perDayPace
            if (perDayPace !== null) {
                series.push({
                    type: 'line',
                    color: theme.palette.info.main,
                    points: allDates.map(i => i < todaySeconds ? -perDayPace : null)
                })
            }

            const daysLeft = appState.timeSpan.daysLeft(appState.today)
            if (daysLeft > 0 && props.leftPerDay !== null) {
                const leftPerDay = Math.max(props.leftPerDay, 0)
                series.push({
                    type: 'dash',
                    color: theme.palette.info.main,
                    points: allDates.map((_, i) => i === allDates.length - 1 || allDates[i + 1] >= todaySeconds ? leftPerDay : null)
                })
            }

            return {
                xvalues: allDates,
                series
            }
        },
        [
            props.perDayExpenses,
            props.perDayPace,
            props.leftPerDay,
            appState.timeSpanInfo,
            appState.today,
            engine.operations,
            engine.categories
        ]
    )

    return (
        <Plot
            elevation={props.sparkline === true ? 0 : 2}
            showAxes={props.sparkline !== true}
            currency={props.currency}
            height={props.sparkline === true ? 50 : 150}
            xvalues={series.xvalues}
            series={series.series}
            title={props.sparkline === true ? undefined : 'Daily Amount'}
            p={props.sparkline === true ? 0 : 1}
        />
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
