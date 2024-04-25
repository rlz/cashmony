import { Box, Paper, Typography } from '@mui/material'
import * as Plot from '@observablehq/plot'
import React, { useEffect, useMemo } from 'react'
import { useResizeDetector } from 'react-resize-detector'

import { formatCurrency } from '../../helpers/currencies'
import { monthFormat, PlotContainer } from './PlotUtils'

interface Props {
    title: string
    /**
     * [{year -> amount}, {year -> amount}, ...] for each month
    */
    stats: readonly Record<number, number>[]
    currency: string
}

export function YMExpensesComparisonPlot({ title, stats, currency }: Props): JSX.Element {
    const { width, ref } = useResizeDetector()

    const data = useMemo(() => {
        return stats.map((e, i) => { return { month: i, perYear: e } })
            .flatMap(({ month, perYear }) => {
                return Object.entries(perYear).map(([year, amount]) => {
                    return {
                        Year: year,
                        month,
                        amount
                    }
                })
            })
    }, [stats])

    useEffect(
        () => {
            if (ref.current == null) {
                return
            }

            const p = Plot.plot({
                width,
                height: 250,
                x: { axis: null, type: 'band' },
                y: { tickFormat: v => formatCurrency(v, currency, true), grid: true, label: 'Total' },
                fx: { label: 'Month' },
                color: { type: 'ordinal', scheme: 'Observable10', legend: true },
                marks: [
                    Plot.barY(data, {
                        x: 'Year',
                        y: 'amount',
                        fill: 'Year',
                        fx: 'month'
                    }),
                    Plot.ruleY([0]),
                    Plot.axisFx({
                        label: null,
                        anchor: 'bottom',
                        tickFormat: monthFormat
                    })
                ]
            })
            ref.current.append(p)

            return () => {
                p.remove()
            }
        },
        [width, stats]
    )

    return (
        <Paper variant={'outlined'}>
            <Box p={1}>
                <Typography variant={'h6'} textAlign={'center'}>{title}</Typography>
                <PlotContainer ref={ref} />
            </Box>
        </Paper>
    )
}
