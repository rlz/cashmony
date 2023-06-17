import { useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { AppState } from '../model/appState'
import { type Account } from '../model/model'
import { Plot, type PlotSeries } from './Plot'

const appState = AppState.instance()

interface AccPlotProps {
    account: Account
    title?: string
    sparkline?: boolean
    perDayAmount?: number[]
    totalAmount?: number[]
}

export const AccPlot = observer(({ title, account, sparkline, perDayAmount, totalAmount }: AccPlotProps): ReactElement => {
    const theme = useTheme()

    const allDates = [...appState.timeSpan.allDates({ includeDayBefore: true })]

    const series: PlotSeries[] = []

    if (perDayAmount !== undefined) {
        series.push(
            {
                type: 'bars',
                color: theme.palette.error.main,
                points: perDayAmount.map(i => i < 0 ? i : null)
            },
            {
                type: 'bars',
                color: theme.palette.success.main,
                points: perDayAmount.map(i => i > 0 ? i : null)
            }
        )
    }

    if (totalAmount !== undefined) {
        const today = appState.today

        series.push({
            type: 'line',
            color: theme.palette.primary.main,
            points: totalAmount.map((a, i) => allDates[i] <= today ? a : null)
        })
    }

    return <Plot
        elevation={sparkline === true ? 0 : 2}
        showAxes={sparkline !== true}
        currency={account.currency}
        height={sparkline === true ? 50 : 250}
        xvalues={allDates.map(d => d.toMillis() / 1000)}
        series={series}
        initialWidth={window.innerWidth - 32}
        title={sparkline === true ? undefined : title}
        p={sparkline === true ? 0 : 1}
    />
})
