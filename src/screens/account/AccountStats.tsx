import { Box } from '@mui/material'
import { ReactElement } from 'react'

import { Account } from '../../model/model'
import { TotalAndChangeStats } from '../../model/stats/data'
import { AccountChangePlot } from '../../widgets/plots/AccountChangePlot'
import { AccountTotalPlot } from '../../widgets/plots/AccountTotalPlot'

interface Props {
    account: Account
    stats: TotalAndChangeStats
}

export function AccountStatsBody({ account, stats }: Props): ReactElement {
    return (
        <Box display={'flex'} flexDirection={'column'} gap={1} mt={1}>
            <AccountTotalPlot stats={stats} currency={account.currency} />
            <AccountChangePlot stats={stats} currency={account.currency} />
        </Box>
    )
}
