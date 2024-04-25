import { styled } from '@mui/material'
import { DateTime } from 'luxon'

export interface Point {
    date: DateTime
    value: number
}

export const PlotContainer = styled('div')(
    {
        '&': {
            figure: {
                margin: 0
            }
        }
    }
)

export function monthFormat(month: number): string {
    return ['Jan', 'Feb', 'Mar',
        'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep',
        'Oct', 'Nov', 'Dec'][month]
}

import { Plot } from '@observablehq/plot'
import React, { useEffect } from 'react'
import { useResizeDetector } from 'react-resize-detector'

interface Props {
    plot: (width: number) => (SVGSVGElement | HTMLElement) & Plot
}

export function PlotWidget({ plot }: Props): JSX.Element {
    const { width, ref } = useResizeDetector<HTMLDivElement>()

    useEffect(
        () => {
            if (
                ref.current === null
                || ref.current === undefined
                || width === undefined
            ) {
                return
            }

            const p = plot(width)
            ref.current.append(p)

            return () => {
                p.remove()
            }
        },
        [width, plot]
    )

    return <PlotContainer ref={ref} />
}
