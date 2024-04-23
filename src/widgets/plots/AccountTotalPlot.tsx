import { Box, Paper, Typography, useTheme } from '@mui/material'
import * as Plot from '@observablehq/plot'
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

export const AccountTotalPlot = observer(function AccountTotalPlot({ stats, currency }: Props): JSX.Element {
    const appState = AppState.instance()
    const { width, ref } = useResizeDetector()
    const theme = useTheme()

    useEffect(
        () => {
            if (ref.current == null) {
                return
            }

            const p = Plot.plot({
                width,
                height: 250,
                x: {
                    type: 'utc',
                    grid: true,
                    domain: [stats.dayTotal[0].date, stats.dayTotal.at(-1)?.date]
                },
                y: { tickFormat: v => formatCurrency(v, currency, true), grid: true, label: null },
                marks: [
                    Plot.lineY(stats.dayTotal.filter(i => i.date <= appState.today), {
                        x: 'date',
                        y: 'value',
                        stroke: theme.palette.primary.main
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
