import { Box, Paper, SxProps, Typography, useTheme } from '@mui/material'
import * as Plot from '@observablehq/plot'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { JSX, useEffect } from 'react'
import { useResizeDetector } from 'react-resize-detector'

import { TotalAndChangeStats } from '../../../engine/stats/model.js'
import { formatCurrency } from '../../helpers/currencies.js'
import { useFrontState } from '../../model/FrontState.js'
import { PlotContainer } from './PlotUtils.js'

interface Props {
    stats: TotalAndChangeStats
    currency: string
}

const sxHeight250: SxProps = { height: 250 }

export const AccountChangePlot = observer(function AccountChangePlot({ stats, currency }: Props): JSX.Element {
    const appState = useFrontState()
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
                <PlotContainer ref={ref} sx={sxHeight250} />
            </Box>
        </Paper>
    )
})
