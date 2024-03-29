import { Box, Paper, Skeleton, type SxProps } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { match, P } from 'ts-pattern'

import { formatCurrency } from '../../helpers/currencies'
import { AppState } from '../../model/appState'
import { DivBody2, Italic, SpanBody1 } from '../generic/Typography'
import { ExpensesBarsPlot } from './ExpensesPlots'

interface Props {
    url: string
    name: string | ReactElement
    totalAmount: number
    todayAmount: number
    perDayGoal: number | null
    perDayExpenses: number[]
    currency: string
    sx?: SxProps
}

export const ExpensesCard = observer((props: Props): ReactElement => {
    const appState = AppState.instance()

    const navigate = useNavigate()

    const timeSpan = appState.timeSpan
    const daysLeft = appState.daysLeft
    const totalDays = timeSpan.totalDays

    const leftPerDay = props.perDayGoal === null || daysLeft === 0
        ? null
        : (props.perDayGoal * totalDays + props.totalAmount - props.todayAmount) / daysLeft

    const periodPace = totalDays - daysLeft === 0
        ? null
        : (props.totalAmount - props.todayAmount) * 30 / (totalDays - daysLeft)

    const cur = (amount: number, compact = false): string => formatCurrency(amount, props.currency, compact)

    return <Box sx={props.sx}>
        <a onClick={() => { navigate(props.url) }}>
            <Paper sx={{ p: 1 }}>
                <Box display={'flex'} gap={1}>
                    <SpanBody1>{ props.name }</SpanBody1>
                    <SpanBody1
                        color={'primary.main'}
                        flex={'1 1 0'}
                        textAlign={'right'}
                    >
                        {cur(match(props.totalAmount).with(0, v => v).otherwise(v => -v))}
                    </SpanBody1>
                </Box>
                <DivBody2 my={1}>
                    <table className={'stats'}>
                        <tbody>
                            <tr>
                                <th>{'Period pace (30d):'}</th>
                                <td>{match(periodPace).with(null, () => '-').otherwise(v => cur(-v))}</td>
                            </tr>
                            <tr>
                                <th>{'Goal (30d):'}</th>
                                <td>{props.perDayGoal !== null ? cur(30 * props.perDayGoal) : '-'}</td>
                            </tr>
                            <tr>
                                <th>{'Left per day:'}</th>
                                <td>
                                    {
                                        match(leftPerDay)
                                            .with(null, () => '-')
                                            .with(P.number.gt(0), v => cur(v))
                                            .otherwise(() => <Italic color={'warning.main'}>{'overspend'}</Italic>)
                                    }
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DivBody2>
                <ExpensesBarsPlot
                    currency={props.currency}
                    sparkline
                    perDayPace={periodPace === null ? null : periodPace / 30}
                    leftPerDay={leftPerDay}
                    perDayExpenses={props.perDayExpenses}
                />
            </Paper>
        </a>
    </Box>
})

export function ExpensesCardSkeleton ({ name, sx }: { name?: string | ReactElement, sx?: SxProps }): ReactElement {
    return <Box sx={sx}>
        <Paper sx={{ p: 1 }}>
            <Box display={'flex'} gap={1}>
                <SpanBody1 flex={'1 1 0'}>
                    { name ?? <Skeleton sx={{ maxWidth: 60 }}/> }
                </SpanBody1>
                <SpanBody1>
                    <Skeleton sx={{ minWidth: 55 }}/>
                </SpanBody1>
            </Box>
            <DivBody2 my={1}>
                <table className={'stats'}>
                    <tbody>
                        <tr>
                            <th><Skeleton sx={{ maxWidth: 55 }}/></th>
                            <td><Skeleton sx={{ minWidth: 55 }}/></td>
                        </tr>
                        <tr>
                            <th><Skeleton sx={{ minWidth: 95 }}/></th>
                            <td><Skeleton sx={{ minWidth: 55 }}/></td>
                        </tr>
                        <tr>
                            <th><Skeleton sx={{ minWidth: 75 }}/></th>
                            <td><Skeleton sx={{ minWidth: 55 }}/></td>
                        </tr>
                    </tbody>
                </table>
            </DivBody2>
            <Skeleton variant={'rectangular'} height={50}/>
        </Paper>
    </Box>
}
