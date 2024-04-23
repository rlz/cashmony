import { Box, useTheme } from '@mui/material'
import Color from 'color'
import * as d3 from 'd3'
import { useResizeDetector } from 'react-resize-detector'

import { AppState } from '../../model/appState'
import { AccountStats } from '../../model/stats/AccountStatsReducer'
import { Point } from './plotUtils'

interface Props {
    stats: AccountStats
}

export function AccountSparklinePlot({ stats }: Props): JSX.Element {
    const appState = AppState.instance()
    const theme = useTheme()
    const { width, ref } = useResizeDetector()

    const height = 50
    const gap = 4

    if (width === undefined) {
        return <Box ref={ref} height={height} />
    }

    let changeData = stats.monthChange
    let totalData = stats.monthTotal

    if (changeData.length < 24) {
        changeData = stats.mWeekChange
        totalData = stats.mWeekTotal
    }

    if (changeData.length < 15) {
        changeData = stats.dayChange
        totalData = stats.dayTotal
    }

    const rectWidth = (width + gap) / changeData.length - gap

    const x = d3.scaleLinear(
        [
            changeData[0].date.toMillis(),
            changeData.at(-1)?.date.toMillis() ?? 0
        ],
        [rectWidth / 2, width - rectWidth / 2]
    )
    const y = d3.scaleLinear(
        [
            Math.min(
                0,
                d3.min(totalData, i => i.value) ?? 0
            ),
            Math.max(1, d3.max(totalData, i => i.value) ?? 0)
        ],
        [height, 0]
    )

    const x2 = d3.scaleLinear(
        [
            changeData[0].date.toMillis(),
            changeData.at(-1)?.date.toMillis() ?? 0
        ],
        [0, width - rectWidth]
    )
    const y2 = d3.scaleLinear(
        [
            Math.min(
                0
            ),
            d3.max(changeData, i => Math.abs(i.value)) ?? 0
        ],
        [height, 0.1 * height]
    )
    const line = d3.line<Point>(d => x(d.date.toMillis()), d => y(d.value))
    const area = d3.area<Point>()
        .x(d => x(d.date.toMillis()))
        .y0(y(0))
        .y1(d => y(d.value))

    return (
        <Box ref={ref} height={height}>
            <svg width={width} height={height}>
                <path
                    fill={Color(theme.palette.primary.main).opaquer(-0.8).hexa()}
                    stroke={'none'}
                    d={area(totalData.filter(i => i.date <= appState.today)) ?? undefined}
                />
                {
                    changeData.map(p => (
                        <rect
                            key={p.date.toISO()}
                            fill={
                                p.value < 0 ? theme.palette.error.main : theme.palette.success.main
                            }
                            x={x2(p.date.toMillis())}
                            width={rectWidth}
                            y={y2(Math.abs(p.value))}
                            height={y2(0) - y2(Math.abs(p.value))}
                        />
                    ))
                }
                <path
                    fill={'none'}
                    stroke={theme.palette.primary.main}
                    strokeWidth={'2'}
                    d={line(totalData.filter(i => i.date <= appState.today)) ?? undefined}
                />
            </svg>
        </Box>
    )
}
