import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { AppState } from '../../model/appState'
import { type ExpensesStats } from '../../model/stats'
import { formatCurrency } from '../../helpers/currencies'
import { Box, Paper, Typography } from '@mui/material'
import { DivBody2 } from '../Typography'
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
        : -1

    return <Box display="flex" flexDirection="column" gap={1} pb={1}>
        <DivBody2 mt={1} py={1}>
            <table className='stats'>
                <tbody>
                    <tr>
                        <th>Period Pace (30d):</th>
                        <td>{cur(-stats.avgUntilToday(30, timeSpan, currency))}</td>
                    </tr>
                    <tr>
                        <th>Left per day:</th>
                        <td>{leftPerDay > 0 ? cur(leftPerDay) : '-'}</td>
                    </tr>
                </tbody>
            </table>
        </DivBody2>
        <Paper elevation={2} sx={{ p: 1 }}>
            <Typography variant='h6' textAlign="center">
                Avg. Pace (30d)
            </Typography>
            <Box display="flex" mb={1}>
                <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                    1 month<br/>
                    {cur(-stats.durationAvg(30, { month: 1 }, currency), true)}
                </Typography>
                <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                    3 month<br/>
                    {cur(-stats.durationAvg(30, { months: 3 }, currency), true)}
                </Typography>
                <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                    1 year<br/>
                    {cur(-stats.durationAvg(30, { year: 1 }, currency), true)}
                </Typography>
            </Box>
        </Paper>
        <ExpensesBarsPlot currency={currency} stats={stats}/>
        <ExpensesTotalPlot currency={currency} stats={stats}/>
    </Box>
})
