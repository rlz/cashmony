import { Box, Paper, SxProps, Typography } from '@mui/material'
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'
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

const sxHeight250: SxProps = { height: 250 }
const sxHeight550: SxProps = { height: 550 }

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
            if (ref.current == null || width === undefined) {
                return
            }

            const p = width < 550
                ? Plot.plot({
                    width,
                    height: 550,
                    x: {
                        tickFormat: v => formatCurrency(v, currency, true),
                        grid: true,
                        label: null,
                        domain: [
                            Math.min(d3.min(data, d => d.amount)!, 0),
                            Math.max(d3.max(data, d => d.amount)!, 1)
                        ]
                    },
                    y: { axis: null, type: 'band' },
                    fy: { label: 'Month' },
                    color: { type: 'ordinal', scheme: 'Observable10', legend: true },
                    marks: [
                        Plot.barX(data, {
                            x: 'amount',
                            y: 'Year',
                            fill: 'Year',
                            fy: 'month'
                        }),
                        Plot.ruleX([0]),
                        Plot.axisFy({
                            label: null,
                            anchor: 'left',
                            tickFormat: monthFormat
                        })
                    ]
                })
                : Plot.plot({
                    width,
                    height: 250,
                    x: { axis: null, type: 'band' },
                    y: {
                        tickFormat: v => formatCurrency(v, currency, true),
                        grid: true,
                        label: 'Total',
                        domain: [
                            Math.min(d3.min(data, d => d.amount)!, 0),
                            Math.max(d3.max(data, d => d.amount)!, 1)
                        ]
                    },
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
                <PlotContainer ref={ref} sx={width === undefined || width < 550 ? sxHeight550 : sxHeight250} />
            </Box>
        </Paper>
    )
}
