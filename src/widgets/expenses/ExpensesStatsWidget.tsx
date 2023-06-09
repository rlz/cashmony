import { Box, Paper, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { match, P } from 'ts-pattern'

import { formatCurrency } from '../../helpers/currencies'
import { AppState } from '../../model/appState'
import { type ExpensesStats } from '../../model/stats'
import { DivBody2, Italic } from '../generic/Typography'
import { ExpensesBarsPlot, ExpensesTotalPlot } from './ExpensesPlots'

interface Props {
    currency: string
    stats: ExpensesStats
}

export const ExpensesStatsWidget = observer(({ currency, stats }: Props): ReactElement => {
    const appState = AppState.instance()
    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    const timeSpan = appState.timeSpan

    const leftPerDay = appState.daysLeft > 0 && stats.perDayGoal !== null
        ? -(stats.leftPerDay(timeSpan, currency)?.value ?? -0)
        : null

    return <Box display={'flex'} flexDirection={'column'} gap={1} pb={1}>
        <DivBody2 mt={1} py={1}>
            <table className={'stats'}>
                <tbody>
                    <tr>
                        <th>{'Period pace (30d):'}</th>
                        <td>{cur(match(stats.avgUntilToday(30, timeSpan, currency)).with(0, () => 0).otherwise(v => -v))}</td>
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
        <Paper elevation={2} sx={{ p: 1 }}>
            <Typography variant={'h6'} textAlign={'center'}>
                {'Avg. Pace (30d)'}
            </Typography>
            <Box display={'flex'} mb={1}>
                <Typography variant={'body2'} textAlign={'center'} flex={'1 1 0'} noWrap minWidth={0}>
                    {'1 month'}<br/>
                    {cur(-stats.durationAvg(30, { month: 1 }, currency), true)}
                </Typography>
                <Typography variant={'body2'} textAlign={'center'} flex={'1 1 0'} noWrap minWidth={0}>
                    {'3 month'}<br/>
                    {cur(-stats.durationAvg(30, { months: 3 }, currency), true)}
                </Typography>
                <Typography variant={'body2'} textAlign={'center'} flex={'1 1 0'} noWrap minWidth={0}>
                    {'1 year'}<br/>
                    {cur(-stats.durationAvg(30, { year: 1 }, currency), true)}
                </Typography>
            </Box>
        </Paper>
        <ExpensesBarsPlot currency={currency} stats={stats}/>
        <ExpensesTotalPlot currency={currency} stats={stats}/>
    </Box>
})
