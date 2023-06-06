import { Paper, Typography } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import type uPlot from 'uplot'
import UplotReact from 'uplot-react'

export type UplotData = uPlot.AlignedData
export type UplotOptions = Omit<uPlot.Options, 'width' | 'pxAlign' | 'cursor' | 'legend'>

interface Props {
    data: uPlot.AlignedData
    opts: UplotOptions
    initialWidth: number
    title?: string
    p?: number
}

export function ResizeableUplot ({ data, opts, initialWidth, title, p }: Props): ReactElement {
    const { width, ref } = useResizeDetector({ handleWidth: true, handleHeight: false })

    return <Paper elevation={2} sx={{ p }}>
        { title !== undefined ? <Typography variant='h6' textAlign="center">{title}</Typography> : null }
        <div ref={ref}>
            <UplotReact
                options={{
                    ...opts,
                    width: width ?? initialWidth,
                    pxAlign: false,
                    cursor: { show: false },
                    legend: { show: false }
                }}
                data={data} />
        </div>
    </Paper>
}
