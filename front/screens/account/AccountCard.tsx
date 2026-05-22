import { Box, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

import { TotalAndChangeStats } from '../../../engine/stats/model.js'
import { formatCurrency } from '../../helpers/currencies.js'
import { useFrontState } from '../../model/FrontState.js'
import { AccountSparklinePlot } from '../../widgets/plots/AccountSparklinePlot.js'

interface Props {
    id: string
    name: string
    stats: TotalAndChangeStats | undefined
}

export const AccountCard = observer(function AccountCard({ id, name, stats }: Props): ReactElement {
    const frontState = useFrontState()
    const navigate = useNavigate()

    if (stats === undefined) {
        return <AccountCardSkeleton />
    }

    const periodInPast = stats.timeSpan.endDate < frontState.today

    return (
        <a onClick={async () => { await navigate(`/accounts/${encodeURIComponent(id)}`) }}>
            <Paper variant={'outlined'}>
                <Box sx={{ p: 1 }}>
                    <Stack direction={'row'} spacing={1}>
                        <Typography component={'div'} variant={'body1'}>{name}</Typography>
                        <Typography component={'div'} variant={'body1'} sx={{ flex: '1 1 0', textAlign: 'right', color: 'primary.main' }}>
                            {
                                formatCurrency(stats.dayTotal.at(-1)?.value ?? 0, stats.currency)
                            }
                        </Typography>
                    </Stack>
                    {
                        periodInPast
                        && (
                            <Typography component={'div'} variant={'body2'} sx={{ textAlign: 'right' }}>
                                <Typography component={'span'} variant={'body2'} color={'secondary.main'}>{'now: '}</Typography>
                                {formatCurrency(stats.total, stats.currency)}
                            </Typography>
                        )
                    }
                    <Box sx={{ mt: 1 }}>
                        <AccountSparklinePlot stats={stats} />
                    </Box>
                </Box>
            </Paper>
        </a>
    )
})

export function AccountCardSkeleton(): ReactElement {
    return (
        <Paper sx={{ p: 1, maxWidth: 900, mx: 'auto', width: '100%' }}>
            <Stack direction={'row'} sx={{ mb: 1 }}>
                <Typography component={'div'} variant={'body1'} sx={{ flex: '1 1 0' }}><Skeleton sx={{ maxWidth: 85 }} /></Typography>
                <Typography component={'div'} variant={'body1'} sx={{ textAlign: 'right', color: 'primary.main' }}>
                    <Skeleton sx={{ minWidth: 55 }} />
                </Typography>
            </Stack>
            <Skeleton variant={'rectangular'} height={50} />
        </Paper>
    )
}
