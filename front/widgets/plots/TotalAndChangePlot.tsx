import { Box, Paper, Typography, useTheme } from '@mui/material'
import * as Plot from '@observablehq/plot'
import Color from 'color'
import { JSX } from 'react'

import { TotalAndChangeStats } from '../../../engine/stats/model.js'
import { formatCurrency } from '../../helpers/currencies.js'
import { PlotWidget } from './PlotUtils.js'

interface Props {
    title: string
    /**
     * if true reverse values
     */
    expense?: boolean
    stats: TotalAndChangeStats
    currency: string
}

export function TotalAndChangePlot({ title, expense, stats, currency }: Props): JSX.Element {
    const theme = useTheme()

    const totalPlot = (width: number) => Plot.plot({
        width,
        height: 250,
        x: { type: 'utc', axis: null },
        y: { tickFormat: v => formatCurrency(v, currency, true), label: 'Total' },
        marks: [
            Plot.lineY(
                stats.dayTotal,
                {
                    x: 'date',
                    y: ({ value }) => expense ? -value : value,
                    stroke: theme.palette.primary.main
                }
            ),
            Plot.areaY(
                stats.dayTotal,
                {
                    x: 'date',
                    y: ({ value }) => expense ? -value : value,
                    fill: Color(theme.palette.primary.main).opaquer(-0.8).hexa()
                }
            )
        ]
    })

    let data = stats.monthChange
    let interval: Plot.Interval = 'month'
    if (data.length < 10) {
        data = stats.mWeekChange
        interval = 'week'
    }
    if (data.length < 10) {
        data = stats.dayChange
        interval = 'day'
    }

    const changePlot = (width: number) => Plot.plot({
        width,
        height: 150,
        x: { type: 'utc' },
        y: {
            tickFormat: v => formatCurrency(v, currency, true),
            domain: stats.dayTotal.every(({ value }) => value === 0) ? [0, 1] : undefined
        },
        marks: [
            Plot.rectY(
                data,
                {
                    x: 'date',
                    y: v => Math.abs(v.value),
                    interval,
                    fill: v => v.value < 0
                        ? theme.palette.error.main
                        : theme.palette.success.main
                }
            )
        ]
    })
    return (
        <Paper variant={'outlined'}>
            <Box p={1}>
                <Typography variant={'h6'} textAlign={'center'}>{title}</Typography>
                <PlotWidget plot={totalPlot} />
                <PlotWidget plot={changePlot} />
            </Box>
        </Paper>
    )
}
