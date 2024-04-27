import { Box, Paper, Typography, useTheme } from '@mui/material'
import * as Plot from '@observablehq/plot'
import Color from 'color'
import { DateTime } from 'luxon'

import { formatCurrency } from '../../helpers/currencies'
import { TotalAndChangeStats } from '../../model/stats/data'
import { PlotWidget } from './PlotUtils'

interface Props {
    title: string
    /**
     * if true show positive amounts in red
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
                    y: 'value',
                    stroke: theme.palette.primary.main
                }
            ),
            Plot.areaY(
                stats.dayTotal,
                {
                    x: 'date',
                    y: 'value',
                    fill: Color(theme.palette.primary.main).opaquer(-0.8).hexa()
                }
            )
        ]
    })

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

    const changePlot = (width: number) => Plot.plot({
        width,
        height: 150,
        x: { type: 'utc' },
        y: { tickFormat: v => formatCurrency(v, currency, true) },
        marks: [
            Plot.rectY(
                data,
                {
                    x: 'date',
                    y: v => Math.abs(v.value),
                    interval: {
                        floor: (v: DateTime) => offset(v, -0.5),
                        offset: (v, o) => offset(v, o ?? 1)
                    },
                    fill: v => (expense === true && v.value >= 0) || (expense !== true && v.value < 0)
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
