import { Box, Paper, Skeleton, Stack, type SxProps, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

import { TotalAndChangeStats } from '../../../engine/stats/model.js'
import { formatCurrency } from '../../helpers/currencies.js'
import { useFrontState } from '../../model/FrontState.js'
import { ExpensesInfoTable } from './ExpensesInfoTable.js'
import { ExpensesBarsPlot } from './ExpensesPlots.js'

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
            <a onClick={async () => { await navigate(props.url) }}>
                <Paper variant={'outlined'}>
                    <Box sx={{ p: 1 }}>
                        <Stack direction={'row'} sx={{ gap: 1 }}>
                            <Typography component={'span'} variant={'body1'}>{ props.name }</Typography>
                            <Typography
                                component={'span'}
                                variant={'body1'}
                                sx={{ color: 'primary.main', flex: '1 1 0', textAlign: 'right' }}
                            >
                                {cur(-props.stats.total)}
                            </Typography>
                        </Stack>
                        <Typography component={'div'} variant={'body2'} sx={{ my: 1 }}>
                            <ExpensesInfoTable
                                currency={props.currency}
                                periodPace={perDay === null ? null : perDay * 30}
                                perDayGoal={props.perDayGoal}
                                leftPerDay={leftPerDay}
                            />
                        </Typography>
                        <ExpensesBarsPlot
                            stats={props.stats}
                            perDay={perDay}
                            leftPerDay={leftPerDay}
                            daysLeft={daysLeft}
                            perDayGoal={props.perDayGoal}
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
                <Stack direction={'row'} sx={{ gap: 1 }}>
                    <Typography component={'span'} variant={'body1'} sx={{ flex: '1 1 0' }}>
                        { name ?? <Skeleton sx={{ maxWidth: 60 }} /> }
                    </Typography>
                    <Typography component={'span'} variant={'body1'}>
                        <Skeleton sx={{ minWidth: 55 }} />
                    </Typography>
                </Stack>
                <Typography component={'div'} variant={'body2'} sx={{ my: 1 }}>
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
                </Typography>
                <Skeleton variant={'rectangular'} height={50} />
            </Paper>
        </Box>
    )
}
