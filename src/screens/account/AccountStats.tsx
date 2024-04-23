import { Box } from '@mui/material'
import { ReactElement } from 'react'

import { Account } from '../../model/model'
import { AccPlot } from '../../widgets/AccountPlots'

interface Props {
    account: Account
    perDayAmount: number[]
    totalAmount: number[]
}

export function AccountStatsBody({ account, perDayAmount, totalAmount }: Props): ReactElement {
    return (
        <Box display={'flex'} flexDirection={'column'} gap={1} mt={1}>
            <AccPlot title={'Amount'} account={account} totalAmount={totalAmount} />
            <AccPlot title={'Per day amount'} account={account} perDayAmount={perDayAmount} />
        </Box>
    )
}
