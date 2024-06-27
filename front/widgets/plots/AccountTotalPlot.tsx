import { Box, Paper, SxProps, Typography, useTheme } from '@mui/material'
import * as Plot from '@observablehq/plot'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import { useResizeDetector } from 'react-resize-detector'

import { TotalAndChangeStats } from '../../../engine/stats/model'
import { formatCurrency } from '../../helpers/currencies'
import { useFrontState } from '../../model/FrontState'
import { PlotContainer } from './PlotUtils'

interface Props {
    stats: TotalAndChangeStats
    currency: string
}

const sxHeight250: SxProps = { height: 250 }

export const AccountTotalPlot = observer(function AccountTotalPlot({ stats, currency }: Props): JSX.Element {
    const appState = useFrontState()
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
                <PlotContainer ref={ref} sx={sxHeight250} />
            </Box>
        </Paper>
    )
})
