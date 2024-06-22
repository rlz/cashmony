import { useTheme } from '@mui/material'
import * as ObsPlot from '@observablehq/plot'
import * as d3 from 'd3'
import { useEffect } from 'react'
import { useResizeDetector } from 'react-resize-detector'

import { TotalAndChangeStats } from '../../../engine/stats/model'
import { PlotContainer } from './PlotUtils'

interface Props {
    stats: TotalAndChangeStats
}

export function AccountSparklinePlot({ stats }: Props): JSX.Element {
    const { width, ref } = useResizeDetector()
    const theme = useTheme()

    useEffect(
        () => {
            if (ref.current == null) {
                return
            }

            let interval: 'day' | 'week' | 'month' = 'day'
            let barData = stats.dayChange

            if (stats.timeSpan.totalDays > 1095) {
                interval = 'month'
                barData = stats.monthChange.map(({ value, date }) => { return { date, value: value / date.daysInMonth } })
            } else if (stats.timeSpan.totalDays > 180) {
                interval = 'week'
                barData = stats.mWeekChange.map(({ value, date }) => { return { date, value: value / 7 } })
            }

            const changeScale = d3.scaleLinear([0, Math.max(1, ...barData.map(i => Math.abs(i.value)))], [0, 1])
            const totalScale = d3.scaleLinear(
                [
                    Math.min(0, ...stats.dayTotal.map(i => i.value)),
                    Math.max(1, ...stats.dayTotal.map(i => i.value))
                ],
                [0, 1]
            )

            const p = ObsPlot.plot({
                width,
                height: 50,
                x: {
                    type: 'utc',
                    grid: false,
                    axis: null
                },
                y: {
                    grid: false,
                    // label: null,
                    axis: null,
                    domain: [0, 1]
                },
                marks: [
                    ObsPlot.rectY(barData, {
                        y: ({ value }) => changeScale(Math.abs(value)),
                        x: 'date',
                        interval,
                        fill: ({ value }) => value >= 0 ? theme.palette.success.main : theme.palette.error.main }
                    ),
                    ObsPlot.lineY(
                        stats.dayTotal,
                        {
                            x: 'date',
                            y: ({ value }) => totalScale(value),
                            filter: ({ date }) => date <= stats.today,
                            stroke: theme.palette.primary.main
                        }
                    )
                ]
            })
            ref.current.append(p)

            return () => {
                p.remove()
            }
        },
        [width, stats]
    )

    return <PlotContainer ref={ref} />
}
