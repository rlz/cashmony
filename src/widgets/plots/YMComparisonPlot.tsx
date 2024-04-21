import { Box, Paper, styled, Typography } from '@mui/material'
import * as Plot from '@observablehq/plot'
import React, { useEffect, useMemo } from 'react'
import { useResizeDetector } from 'react-resize-detector'

import { formatCurrency } from '../../helpers/currencies'
import { YMComparisonReducer } from '../../model/stats/YMComparisonReducer'

interface Props {
    reducer: YMComparisonReducer
    currency: string
}

export function YMComparisonPlot({ reducer, currency }: Props): JSX.Element {
    const { width, ref } = useResizeDetector()

    const data = useMemo(() => {
        return reducer.expenses.map((e, i) => { return { month: i, perYear: e } })
            .flatMap(({ month, perYear }) => {
                return Object.entries(perYear).map(([year, amount]) => {
                    return {
                        Year: year,
                        month,
                        amount: -amount
                    }
                })
            })
    }, [reducer.expenses])

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
                color: { type: 'ordinal', scheme: 'Category10', legend: true },
                marks: [
                    Plot.barY(data, {
                        x: 'Year',
                        y: 'amount',
                        fill: 'Year',
                        fx: 'month'
                        // tip: {
                        //     format: {
                        //         fx: false,
                        //         y: v => formatCurrency(v, currency)
                        //     }
                        // }
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
        [width, reducer.expenses]
    )

    return (
        <Paper variant={'outlined'}>
            <Box p={1}>
                <Typography variant={'h6'} textAlign={'center'}>{'Y/M Comparison'}</Typography>
                <PlotContainer ref={ref} />
            </Box>
        </Paper>
    )
}

const PlotContainer = styled('div')(
    {
        '&': {
            figure: {
                margin: 0
            }
        }
    }
)

function monthFormat(month: number): string {
    return ['Jan', 'Feb', 'Mar',
        'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep',
        'Oct', 'Nov', 'Dec'][month]
}
