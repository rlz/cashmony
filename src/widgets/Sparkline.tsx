import { Paper, useTheme } from '@mui/material'
import React, { useMemo, type ReactElement } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import UplotReact from 'uplot-react'
import { type CategoryStats } from '../model/stats'
import uPlot from 'uplot'
import { AppState } from '../model/appState'
import { observer } from 'mobx-react-lite'
import { OperationsModel } from '../model/operations'
import { CategoriesModel } from '../model/categories'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()
const categoriesModel = CategoriesModel.instance()

export const Sparkline = observer(({ stats }: { stats: CategoryStats }): ReactElement => {
    const theme = useTheme()

    const uPlotGraphs = useMemo(
        () => {
            const today = appState.today
            const allDates = [...appState.timeSpan.allDates({ includeDayBefore: true })]
            const cumulativeAmountByDates = [0, ...stats.cumulativeAmountByDates()].map(a => a === undefined ? a : -a)

            const data: uPlot.AlignedData = [
                allDates.map(d => d.toMillis()),
                [undefined, ...stats.amountByDate()].map(a => a === undefined || a === 0 ? null : -a),
                cumulativeAmountByDates
            ]

            const bars = uPlot.paths.bars

            if (bars === undefined) {
                throw Error('bars expected here')
            }

            const series: uPlot.Series[] = [
                {},
                {
                    stroke: theme.palette.error.main,
                    fill: theme.palette.error.main,
                    scale: 'non-cumulative',
                    points: {
                        show: false
                    },
                    paths: bars({ size: [0.5], align: -1 })
                },
                {
                    stroke: theme.palette.primary.main,
                    scale: 'cumulative',
                    points: {
                        show: false
                    }
                }
            ]

            if (today >= appState.timeSpan.startDate && today < appState.timeSpan.endDate) {
                const daysFromStartDate = today.diff(appState.timeSpan.startDate, 'days').days + 1
                const periodTotal = -stats.periodTotal()

                data.push(
                    allDates.map((_, i) => i < daysFromStartDate ? undefined : periodTotal * i / daysFromStartDate),
                    allDates.map((_, i) => i === daysFromStartDate ? periodTotal : undefined)
                )
                series.push(
                    {
                        stroke: theme.palette.primary.main,
                        scale: 'cumulative',
                        dash: [10, 3],
                        points: {
                            show: false
                        }
                    },
                    {
                        scale: 'cumulative',
                        points: {
                            show: true,
                            size: 5,
                            fill: theme.palette.primary.light
                        }
                    }

                )
            }

            const yearGoal = stats.category.yearGoal
            if (yearGoal !== undefined) {
                const perDay = -yearGoal / today.daysInYear
                data.push(allDates.map((_, i) => perDay * i))

                series.push({
                    stroke: theme.palette.success.main,
                    scale: 'cumulative',
                    points: {
                        show: false
                    }
                })
            }

            return { data, series }
        },
        [
            appState.timeSpanInfo,
            appState.today,
            operationsModel.operations,
            categoriesModel.categories
        ]
    )

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
        series: uPlotGraphs.series
    }

    return <Plot data={uPlotGraphs.data} opts={opts}/>
})

function Plot ({ data, opts }: { data: uPlot.AlignedData, opts: uPlot.Options }): ReactElement {
    const { width, height, ref } = useResizeDetector()

    return <Paper elevation={2}>
        <div ref={ref}>
            <UplotReact options={{ ...opts, width: width ?? opts.width, height: height ?? opts.height }} data={data} />
        </div>
    </Paper>
}
