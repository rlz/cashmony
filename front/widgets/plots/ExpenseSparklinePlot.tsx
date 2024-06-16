import { Box, useTheme } from '@mui/material'
import Color from 'color'
import * as d3 from 'd3'
import { useResizeDetector } from 'react-resize-detector'

import { Point, TotalAndChangeStats } from '../../../engine/stats/model'

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
    const gap = 2

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

    const markRectWidth = (width + gap) / changeData.length - gap

    const lineScaleX = d3.scaleLinear(
        [
            changeData[0].date.toMillis(),
            changeData.at(-1)?.date.toMillis() ?? 0
        ],
        [0, width - markRectWidth]
    )
    const scaleY = d3.scaleLinear(
        [
            0,
            Math.max(perDay ?? 1, leftPerDay ?? 1, perDayGoal ?? 1, d3.max(changeData, i => Math.abs(i.value)) ?? 1)
        ],
        [height, 0]
    )

    const rectScaleX = d3.scaleLinear(
        [
            changeData[0].date.toMillis(),
            changeData.at(-1)?.date.toMillis() ?? 0
        ],
        [0, width - markRectWidth]
    )

    const plotLastDate = stats.dayChange[stats.dayChange.length - 1].date.plus({ day: 1 })
    // const rectY = d3.scaleLinear(
    //     [
    //         0,
    //         d3.max(changeData, i => Math.abs(i.value)) ?? 0
    //     ],
    //     [height, 0.1 * height]
    // )

    const perDayPoints: Point[] | null = perDay === null
        ? null
        : [
                { date: stats.dayChange[0].date, value: perDay },
                {
                    date: daysLeft <= 1
                        ? plotLastDate
                        : stats.dayChange[stats.dayChange.length - daysLeft + 1].date,
                    value: perDay }
            ]

    const leftPerDayPoints: Point[] | null = leftPerDay === null || daysLeft === 0
        ? null
        : [
                { date: stats.dayChange[stats.dayChange.length - daysLeft].date, value: leftPerDay },
                { date: plotLastDate, value: leftPerDay }
            ]

    const perDayGoalPoints: Point[] | null = perDayGoal === null
        ? null
        : [
                { date: stats.dayChange[0].date, value: perDayGoal },
                { date: plotLastDate, value: perDayGoal }
            ]

    const line = d3.line<Point>(d => lineScaleX(d.date.toMillis()), d => scaleY(d.value))
    const area = d3.area<Point>()
        .x(d => lineScaleX(d.date.toMillis()))
        .y0(scaleY(0))
        .y1(d => scaleY(d.value))

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
                            x={rectScaleX(p.date.toMillis())}
                            width={markRectWidth}
                            y={scaleY(Math.abs(p.value))}
                            height={scaleY(0) - scaleY(Math.abs(p.value))}
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
