import { Box, Paper, Skeleton, type SxProps } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

import { TotalAndChangeStats } from '../../../engine/stats/model'
import { formatCurrency } from '../../helpers/currencies'
import { useFrontState } from '../../model/FrontState'
import { DivBody2, SpanBody1 } from '../generic/Typography'
import { ExpensesInfoTable } from './ExpensesInfoTable'
import { ExpensesBarsPlot } from './ExpensesPlots'

interface Props {
    url: string
    name: string | ReactElement
    perDayGoal: number | null
    stats: TotalAndChangeStats | undefined
    currency: string
    sx?: SxProps
}

export const ExpensesCard = observer((props: Props): ReactElement => {
    const frontState = useFrontState()

    const navigate = useNavigate()

    if (props.stats === undefined) {
        return <ExpensesCardSkeleton />
    }

    const today = frontState.today
    const timeSpan = props.stats.timeSpan
    const daysLeft = timeSpan.daysLeft(today)
    const totalDays = timeSpan.totalDays

    const leftPerDay = props.perDayGoal === null || daysLeft === 0
        ? null
        : (props.perDayGoal * totalDays + props.stats.total - props.stats.todayChange) / daysLeft

    const perDay = totalDays - daysLeft === 0
        ? null
        : -props.stats.total / (totalDays - daysLeft + (timeSpan.includesDate(today) ? 1 : 0))

    const cur = (amount: number, compact = false): string => formatCurrency(amount, props.currency, compact)

    return (
        <Box sx={props.sx}>
            <a onClick={() => { navigate(props.url) }}>
                <Paper variant={'outlined'}>
                    <Box p={1}>
                        <Box display={'flex'} gap={1}>
                            <SpanBody1>{ props.name }</SpanBody1>
                            <SpanBody1
                                color={'primary.main'}
                                flex={'1 1 0'}
                                textAlign={'right'}
                            >
                                {cur(-props.stats.total)}
                            </SpanBody1>
                        </Box>
                        <DivBody2 my={1}>
                            <ExpensesInfoTable
                                currency={props.currency}
                                periodPace={perDay === null ? null : perDay * 30}
                                perDayGoal={props.perDayGoal}
                                leftPerDay={leftPerDay}
                            />
                        </DivBody2>
                        <ExpensesBarsPlot
                            stats={props.stats}
                            today={today}
                            perDay={perDay}
                            leftPerDay={leftPerDay}
                            daysLeft={daysLeft}
                            perDayGoal={props.perDayGoal}
                            currency={props.currency}
                            sparkline={true}
                        />
                    </Box>
                </Paper>
            </a>
        </Box>
    )
})

export function ExpensesCardSkeleton({ name, sx }: { name?: string | ReactElement, sx?: SxProps }): ReactElement {
    return (
        <Box sx={sx}>
            <Paper sx={{ p: 1 }}>
                <Box display={'flex'} gap={1}>
                    <SpanBody1 flex={'1 1 0'}>
                        { name ?? <Skeleton sx={{ maxWidth: 60 }} /> }
                    </SpanBody1>
                    <SpanBody1>
                        <Skeleton sx={{ minWidth: 55 }} />
                    </SpanBody1>
                </Box>
                <DivBody2 my={1}>
                    <table className={'stats'}>
                        <tbody>
                            <tr>
                                <th><Skeleton sx={{ maxWidth: 55 }} /></th>
                                <td><Skeleton sx={{ minWidth: 55 }} /></td>
                            </tr>
                            <tr>
                                <th><Skeleton sx={{ minWidth: 95 }} /></th>
                                <td><Skeleton sx={{ minWidth: 55 }} /></td>
                            </tr>
                            <tr>
                                <th><Skeleton sx={{ minWidth: 75 }} /></th>
                                <td><Skeleton sx={{ minWidth: 55 }} /></td>
                            </tr>
                        </tbody>
                    </table>
                </DivBody2>
                <Skeleton variant={'rectangular'} height={50} />
            </Paper>
        </Box>
    )
}
