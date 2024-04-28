import { Box, useTheme } from '@mui/material'
import Color from 'color'
import * as d3 from 'd3'
import { useResizeDetector } from 'react-resize-detector'

import { Point, TotalAndChangeStats } from '../../model/stats/data'

interface Props {
    stats: TotalAndChangeStats
    perDay: number | null
    leftPerDay: number | null
    daysLeft: number
    perDayGoal: number | null
}

export function ExpenseSparklinePlot({ stats, perDay, leftPerDay, daysLeft, perDayGoal }: Props): JSX.Element {
    const theme = useTheme()
    const { width, ref } = useResizeDetector()

    const height = 50
    const gap = 4

    if (width === undefined) {
        return <Box ref={ref} height={height} />
    }

    let changeData = stats.monthChange

    if (changeData.length < 24) {
        changeData = stats.mWeekChange
    }

    if (changeData.length < 15) {
        changeData = stats.dayChange
    }

    const rectWidth = (width + gap) / changeData.length - gap

    const lineX = d3.scaleLinear(
        [
            changeData[0].date.toMillis(),
            changeData.at(-1)?.date.toMillis() ?? 0
        ],
        [rectWidth / 2, width - rectWidth / 2]
    )
    const lineY = d3.scaleLinear(
        [
            0,
            Math.max(perDay ?? 1, leftPerDay ?? 1, perDayGoal ?? 1)
        ],
        [height, 0]
    )

    const rectX = d3.scaleLinear(
        [
            changeData[0].date.toMillis(),
            changeData.at(-1)?.date.toMillis() ?? 0
        ],
        [0, width - rectWidth]
    )
    const rectY = d3.scaleLinear(
        [
            0,
            d3.max(changeData, i => Math.abs(i.value)) ?? 0
        ],
        [height, 0.1 * height]
    )

    const perDayPoints: Point[] | null = perDay === null
        ? null
        : [
                { date: stats.dayChange[0].date, value: perDay },
                { date: stats.dayChange[stats.dayChange.length - Math.max(daysLeft, 1)].date, value: perDay }
            ]

    const leftPerDayPoints: Point[] | null = leftPerDay === null || daysLeft === 0
        ? null
        : [
                { date: stats.dayChange[stats.dayChange.length - daysLeft].date, value: leftPerDay },
                { date: stats.dayChange[stats.dayChange.length - 1].date, value: leftPerDay }
            ]

    const perDayGoalPoints: Point[] | null = perDayGoal === null
        ? null
        : [
                { date: stats.dayChange[0].date, value: perDayGoal },
                { date: stats.dayChange[stats.dayChange.length - 1].date, value: perDayGoal }
            ]

    const line = d3.line<Point>(d => lineX(d.date.toMillis()), d => lineY(d.value))
    const area = d3.area<Point>()
        .x(d => lineX(d.date.toMillis()))
        .y0(lineY(0))
        .y1(d => lineY(d.value))

    return (
        <Box ref={ref} height={height}>
            <svg width={width} height={height}>
                {
                    perDayPoints !== null
                    && (
                        <path
                            fill={Color(theme.palette.primary.main).opaquer(-0.8).hexa()}
                            stroke={'none'}
                            d={area(perDayPoints) ?? undefined}
                        />
                    )
                }
                {
                    leftPerDayPoints !== null
                    && (
                        <path
                            fill={Color(theme.palette.success.main).opaquer(-0.8).hexa()}
                            stroke={'none'}
                            d={area(leftPerDayPoints) ?? undefined}
                        />
                    )
                }
                {
                    changeData.map(p => (
                        <rect
                            key={p.date.toISO()}
                            fill={
                                p.value >= 0
                                    ? theme.palette.error.main
                                    : theme.palette.success.main
                            }
                            x={rectX(p.date.toMillis())}
                            width={rectWidth}
                            y={rectY(Math.abs(p.value))}
                            height={rectY(0) - rectY(Math.abs(p.value))}
                        />
                    ))
                }
                {
                    perDayPoints !== null
                    && (
                        <path
                            fill={'none'}
                            stroke={theme.palette.primary.main}
                            strokeWidth={'2'}
                            d={line(perDayPoints) ?? undefined}
                        />
                    )
                }
                {
                    leftPerDayPoints !== null
                    && (
                        <path
                            fill={'none'}
                            stroke={theme.palette.success.main}
                            strokeWidth={'2'}
                            d={line(leftPerDayPoints) ?? undefined}
                        />
                    )
                }
                {
                    perDayGoalPoints !== null
                    && (
                        <path
                            fill={'none'}
                            stroke={theme.palette.warning.main}
                            strokeWidth={'1'}
                            strokeDasharray={'4 3'}
                            d={line(perDayGoalPoints) ?? undefined}
                        />
                    )
                }
            </svg>
        </Box>
    )
}
