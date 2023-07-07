import { Box, Paper, Skeleton, type SxProps } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { match, P } from 'ts-pattern'

import { formatCurrency } from '../../helpers/currencies'
import { utcToday } from '../../helpers/dates'
import { AppState } from '../../model/appState'
import { CurrenciesModel } from '../../model/currencies'
import { type ExpensesStats } from '../../model/stats'
import { DivBody2, Italic, SpanBody1 } from '../generic/Typography'
import { ExpensesBarsPlot } from './ExpensesPlots'

interface Props {
    url: string
    name: string | ReactElement
    stats: ExpensesStats
    sx?: SxProps
}

export const ExpensesCard = observer((props: Props): ReactElement => {
    const navigate = useNavigate()

    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    if (currenciesModel.rates === null) {
        return <ExpensesCardSkeleton sx={props.sx}/>
    }

    const currency = props.stats.perDayGoal?.currency ?? appState.masterCurrency

    const goal30 = props.stats.goal(30)
    const leftPerDay = match(props.stats.leftPerDay(appState.timeSpan, currency))
        .with(null, () => null)
        .with({ value: P.select() }, v => -v)
        .otherwise(() => 0)

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    return <Box sx={props.sx}>
        <a onClick={() => { navigate(props.url) }}>
            <Paper sx={{ p: 1 }}>
                <Box display='flex' gap={1}>
                    <SpanBody1>{ props.name }</SpanBody1>
                    <SpanBody1
                        color='primary.main'
                        flex='1 1 0'
                        textAlign='right'
                    >
                        {cur(match(props.stats.amountTotal(appState.timeSpan, currency)).with(0, v => v).otherwise(v => -v))}
                    </SpanBody1>
                </Box>
                <DivBody2 my={1}>
                    <table className='stats'>
                        <tbody>
                            <tr>
                                <th>Period pace (30d):</th>
                                <td>{cur(match(props.stats.avgUntilToday(30, appState.timeSpan, currency)).with(0, () => 0).otherwise(v => -v))}</td>
                            </tr>
                            <tr>
                                <th>Goal (30d):</th>
                                <td>{goal30 !== null ? cur(-goal30.value * currenciesModel.getRate(utcToday(), goal30.currency, currency)) : '-'}</td>
                            </tr>
                            <tr>
                                <th>Left per day:</th>
                                <td>
                                    {
                                        match(leftPerDay)
                                            .with(null, () => '-')
                                            .with(P.number.gt(0), v => cur(v))
                                            .otherwise(() => <Italic color={'warning.main'}>overspend</Italic>)
                                    }
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DivBody2>
                <ExpensesBarsPlot currency={currency} sparkline stats={props.stats} />
            </Paper>
        </a>
    </Box>
})

export function ExpensesCardSkeleton ({ sx }: { sx?: SxProps }): ReactElement {
    return <Box sx={sx}>
        <Paper sx={{ p: 1 }}>
            <Box display='flex' gap={1}>
                <SpanBody1 flex='1 1 0'><Skeleton sx={{ maxWidth: 60 }}/></SpanBody1>
                <SpanBody1>
                    <Skeleton sx={{ minWidth: 55 }}/>
                </SpanBody1>
            </Box>
            <DivBody2 my={1}>
                <table className='stats'>
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
            <Skeleton variant='rectangular' height={50}/>
        </Paper>
    </Box>
}
