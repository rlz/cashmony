import { Box, Paper, Typography, useTheme } from '@mui/material'
import * as Plot from '@observablehq/plot'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import { useResizeDetector } from 'react-resize-detector'

import { formatCurrency } from '../../helpers/currencies'
import { AppState } from '../../model/appState'
import { AccountStats } from '../../model/stats/AccountStatsReducer'
import { PlotContainer } from './plotUtils'

interface Props {
    stats: AccountStats
    currency: string
}

export const AccountChangePlot = observer(function AccountChangePlot({ stats, currency }: Props): JSX.Element {
    const appState = AppState.instance()
    const { width, ref } = useResizeDetector()
    const theme = useTheme()

    useEffect(
        () => {
            if (ref.current == null || width === undefined) {
                return
            }

            let data = stats.monthChange
            let offset = (d: DateTime, i: number) => d.plus({ month: i })
            if (data.length < 10) {
                data = stats.mWeekChange
                offset = (d, i) => d.plus({ weeks: i })
            }
            if (data.length < 10) {
                data = stats.dayChange
                offset = (d, i) => d.plus({ days: i })
            }

            const marginLeft = 45
            const marginRight = 20
            const gap = 2
            const rectWidth = Math.max(1, (width - marginLeft - marginRight + gap) / data.length - gap)

            const p = Plot.plot({
                width,
                height: 250,
                marginLeft,
                marginRight,
                x: {
                    type: 'utc',
                    grid: true,
                    domain: [data[0].date, data.at(-1)?.date],
                    range: [marginLeft + rectWidth / 2, width - marginRight - rectWidth / 2]
                },
                y: { tickFormat: v => formatCurrency(v, currency, true), grid: true, label: null },
                marks: [
                    Plot.rectY(data.filter(i => i.date <= appState.today), {
                        x: 'date',
                        y: v => Math.abs(v.value),
                        interval: {
                            floor: (v: DateTime) => offset(v, -0.5),
                            offset: (v, o) => offset(v, o ?? 1)
                        },
                        fill: v => v.value < 0 ? theme.palette.error.main : theme.palette.success.main
                    })
                ]
            })
            ref.current.append(p)

            return () => {
                p.remove()
            }
        },
        [width, stats, appState.today]
    )

    return (
        <Paper variant={'outlined'}>
            <Box p={1}>
                <Typography variant={'h6'} textAlign={'center'}>{'Amount'}</Typography>
                <PlotContainer ref={ref} />
            </Box>
        </Paper>
    )
})
