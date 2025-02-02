import { Box, Paper, Typography, useTheme } from '@mui/material'
import * as Plot from '@observablehq/plot'
import React, { JSX, useMemo } from 'react'

import { formatCurrency } from '../../helpers/currencies'
import { PlotWidget } from './PlotUtils'

interface Props {
    expenses: Record<number, number>
    incomes: Record<number, number>
    currency: string
}

export function YearExpenseIncomeComparisonPlot({ expenses, incomes, currency }: Props): JSX.Element {
    const theme = useTheme()

    const plot = useMemo(() => {
        return (width: number) => {
            return Plot.plot({
                width,
                height: 250,
                x: { label: null, tickFormat: v => formatCurrency(v, currency, true) },
                y: { label: null, type: 'band' },
                marks: [
                    Plot.barX(
                        Object.entries(incomes).map(([year, value]) => { return { year, value } }),
                        {
                            x: 'value',
                            y: 'year',
                            fill: theme.palette.success.main
                        }
                    ),
                    Plot.barX(
                        Object.entries(expenses).map(([year, value]) => { return { year, value } }),
                        {
                            x: 'value',
                            y: 'year',
                            fill: theme.palette.error.main,
                            sort: { y: 'y', reverse: true },
                            insetBottom: 6,
                            insetTop: 6
                        }
                    )
                ]
            })
        }
    }, [expenses, incomes, currency])

    return (
        <Paper variant={'outlined'}>
            <Box p={1}>
                <Typography variant={'h6'} textAlign={'center'}>{'Expense/Income by Year'}</Typography>
                <PlotWidget plot={plot} />
            </Box>
        </Paper>
    )
}
