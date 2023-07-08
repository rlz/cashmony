import 'uplot/dist/uPlot.min.css'

import { Box, Paper, Typography, useTheme } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import { match } from 'ts-pattern'
import uPlot from 'uplot'
import UplotReact from 'uplot-react'

import { formatCurrency } from '../helpers/currencies'
import { nonNull, showIf } from '../helpers/smallTools'

export interface PlotSeries {
    points: Array<number | null | undefined>
    type: 'bars' | 'line' | 'dash'
    color: string
}

interface Props {
    elevation: number
    showAxes: boolean
    currency: string
    title?: string
    p?: number
    height: number

    xvalues: number[]
    series: PlotSeries[]
}

export function Plot (props: Props): ReactElement {
    const { width, ref } = useResizeDetector({ handleWidth: true, handleHeight: false })
    const theme = useTheme()
    const gridStrokeColor = theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[400]
    const axe = {
        stroke: theme.palette.text.primary,
        show: props.showAxes,
        ticks: {
            stroke: gridStrokeColor,
            width: 1
        },
        grid: {
            stroke: gridStrokeColor,
            width: 1
        }
    }

    const bars = nonNull(uPlot.paths.bars, 'uPlot.paths.bars always expected here')

    const plot = <Box p={props.p}>
        {
            showIf(
                props.title !== undefined,
                <Typography variant='h6' textAlign='center'>{props.title}</Typography>
            )
        }
        <div ref={ref}>
            {
                width !== undefined
                    ? <UplotReact
                        options={{
                            width,
                            height: props.height,
                            pxAlign: false,
                            cursor: { show: false },
                            legend: { show: false },
                            axes: [
                                axe,
                                {
                                    ...axe,
                                    values: (_, vals) => vals.map(v => formatCurrency(v, props.currency, true))
                                }
                            ],
                            series: [
                                {},
                                ...props.series.map(
                                    (ser): uPlot.Series =>
                                        match(ser)
                                            .with({ type: 'line' }, s => {
                                                return {
                                                    stroke: s.color,
                                                    points: { show: false }
                                                }
                                            })
                                            .with({ type: 'dash' }, s => {
                                                return {
                                                    stroke: s.color,
                                                    points: { show: false },
                                                    dash: [4, 6]
                                                }
                                            })
                                            .with({ type: 'bars' }, s => {
                                                return {
                                                    stroke: s.color,
                                                    fill: s.color,
                                                    points: { show: false },
                                                    paths: bars({ size: [0.8], align: -1 })
                                                }
                                            })
                                            .exhaustive()
                                )
                            ]
                        }}
                        data={[
                            props.xvalues,
                            ...props.series.map(s => s.points)
                        ]} />
                    : <Box height={props.height}/>
            }
        </div>
    </Box>

    return match(props.elevation)
        .with(0, () => plot)
        .otherwise(v => <Paper elevation={v}>{plot}</Paper>)
}
