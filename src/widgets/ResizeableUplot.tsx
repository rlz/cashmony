import { Box, Paper, Typography, useTheme } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import type uPlot from 'uplot'
import UplotReact from 'uplot-react'
import { formatCurrency } from '../helpers/currencies'

export type UplotData = uPlot.AlignedData
export type UplotOptions = Omit<uPlot.Options, 'width' | 'pxAlign' | 'cursor' | 'legend' | 'axes'>

interface Props {
    elevation: number
    showAxes: boolean
    currency: string
    data: uPlot.AlignedData
    opts: UplotOptions
    initialWidth: number
    title?: string
    p?: number
}

export function ResizeableUplot ({ elevation, showAxes, currency, data, opts, initialWidth, title, p }: Props): ReactElement {
    const { width, ref } = useResizeDetector({ handleWidth: true, handleHeight: false })
    const theme = useTheme()
    const gridStrokeColor = theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[400]
    const axe = {
        stroke: theme.palette.text.primary,
        show: showAxes,
        ticks: {
            stroke: gridStrokeColor,
            width: 1
        },
        grid: {
            stroke: gridStrokeColor,
            width: 1
        }
    }

    const plot = <Box p={p}>
        { title !== undefined ? <Typography variant='h6' textAlign="center">{title}</Typography> : null }
        <div ref={ref}>
            <UplotReact
                options={{
                    ...opts,
                    width: width ?? initialWidth,
                    pxAlign: false,
                    cursor: { show: false },
                    legend: { show: false },
                    axes: [
                        axe,
                        {
                            ...axe,
                            values: (_, vals) => vals.map(v => formatCurrency(v, currency, true))
                        }
                    ]
                }}
                data={data} />
        </div>
    </Box>

    return elevation === 0 ? plot : <Paper elevation={elevation}>{plot}</Paper>
}
