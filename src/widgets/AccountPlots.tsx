import { useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { AppState } from '../model/appState'
import { type UplotOptions, type UplotData, ResizeableUplot } from './ResizeableUplot'
import uPlot from 'uplot'
import { type Account } from '../model/model'

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

    const data: UplotData = [
        allDates.map(d => d.toMillis() / 1000)
    ]

    const series: uPlot.Series[] = [{}]

    if (perDayAmount !== undefined) {
        const bars = uPlot.paths.bars

        if (bars === undefined) {
            throw Error('bars expected here')
        }

        data.push(
            perDayAmount.map(i => i < 0 ? i : null),
            perDayAmount.map(i => i > 0 ? i : null)
        )
        series.push(
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
            }
        )
    }

    if (totalAmount !== undefined) {
        const today = appState.today

        data.push(totalAmount.map((a, i) => allDates[i] <= today ? a : null))
        series.push(
            {
                stroke: theme.palette.primary.main,
                points: { show: false }
            }
        )
    }

    const opts: UplotOptions = {
        height: sparkline === true ? 50 : 250,
        series
    }

    return <ResizeableUplot
        elevation={sparkline === true ? 0 : 2}
        showAxes={sparkline !== true}
        currency={account.currency}
        data={data}
        opts={opts}
        initialWidth={window.innerWidth - 32}
        title={sparkline === true ? undefined : title}
        p={sparkline === true ? 0 : 1}
    />
})
