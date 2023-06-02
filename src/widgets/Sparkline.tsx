import { Paper, useTheme } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import UplotReact from 'uplot-react'
import { type CatMonthStats } from '../model/stats'
import uPlot from 'uplot'

export function Sparkline ({ stats }: { stats: CatMonthStats }): ReactElement {
    const theme = useTheme()

    const bars = uPlot.paths.bars

    if (bars === undefined) {
        throw Error('bars expected here')
    }

    const data: uPlot.AlignedData = [
        stats.allDays.map(d => d.toMillis()),
        stats.amounts.map(a => a === undefined ? undefined : -a),
        stats.amountsSum.map(a => a === undefined ? undefined : -a)
    ]

    const opts: uPlot.Options = {
        width: 400,
        height: 50,
        pxAlign: false,
        cursor: {
            show: false
        },
        legend: {
            show: false
        },
        scales: {
            x: {
                time: false
            }
        },
        axes: [
            {
                show: false
            },
            {
                show: false
            }
        ],
        series: [
            {},
            {
                label: 'Amount',
                stroke: theme.palette.error.main,
                fill: theme.palette.error.main,
                scale: 'non-cumulative',
                points: {
                    show: false
                },
                paths: bars({ size: [0.8], align: -1 })
                // fill: 'rgba(255, 0, 0, 0.3)'
            },
            {
                stroke: theme.palette.primary.main,
                scale: 'cumulative',
                points: {
                    show: false
                }
            }
        ]
    }

    if (stats.category.yearGoal !== undefined) {
        data.push(stats.allDays.map((_, i) => Math.abs(stats.category.yearGoal ?? 0) / 365 * i))
        opts.series.push({
            stroke: theme.palette.success.main,
            scale: 'cumulative',
            points: {
                show: false
            }
        })
    }

    return <Plot data={data} opts={opts}/>
}

function Plot ({ data, opts }: { data: uPlot.AlignedData, opts: uPlot.Options }): ReactElement {
    const { width, height, ref } = useResizeDetector()

    return <Paper elevation={2}>
        <div ref={ref}>
            <UplotReact options={{ ...opts, width: width ?? opts.width, height: height ?? opts.height }} data={data} />
        </div>
    </Paper>
}
