import { Box, Paper, Skeleton, Stack } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

import { formatCurrency } from '../../helpers/currencies'
import { AppState } from '../../model/appState'
import { TotalAndChangeStats } from '../../model/stats/data'
import { DivBody1, DivBody2, SpanBody2 } from '../../widgets/generic/Typography'
import { SparklinePlot } from '../../widgets/plots/SparklinePlot'

interface Props {
    total?: boolean
    name: string
    currency: string
    stats: TotalAndChangeStats
}

export const AccountCard = observer(function AccountCard({ total, name, currency, stats }: Props): ReactElement {
    const appState = AppState.instance()
    const navigate = useNavigate()

    const periodInPast = stats.dayTotal[stats.dayTotal.length - 1].date < appState.today

    return (
        <a onClick={() => { navigate(`/accounts/${encodeURIComponent(total === true ? '_total' : name)}`) }}>
            <Paper variant={'outlined'}>
                <Box p={1}>
                    <Stack direction={'row'} spacing={1}>
                        <DivBody1>{name}</DivBody1>
                        <DivBody1 flex={'1 1 0'} textAlign={'right'} color={'primary.main'}>
                            {
                                formatCurrency(stats.dayTotal.at(-1)?.value ?? 0, currency)
                            }
                        </DivBody1>
                    </Stack>
                    {
                        periodInPast
                        && (
                            <DivBody2 textAlign={'right'}>
                                <SpanBody2 color={'secondary.main'}>{'now: '}</SpanBody2>
                                {formatCurrency(stats.last, currency)}
                            </DivBody2>
                        )
                    }
                    <Box mt={1}>
                        <SparklinePlot stats={stats} />
                    </Box>
                </Box>
            </Paper>
        </a>
    )
})

export function AccountCardSkeleton(): ReactElement {
    return (
        <Paper sx={{ p: 1, maxWidth: 900, mx: 'auto', width: '100%' }}>
            <Box display={'flex'} mb={1}>
                <DivBody1 flex={'1 1 0'}><Skeleton sx={{ maxWidth: 85 }} /></DivBody1>
                <DivBody1 textAlign={'right'} color={'primary.main'}>
                    <Skeleton sx={{ minWidth: 55 }} />
                </DivBody1>
            </Box>
            <Skeleton variant={'rectangular'} height={50} />
        </Paper>
    )
}
