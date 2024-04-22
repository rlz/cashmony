import { Box, Paper, Skeleton } from '@mui/material'
import { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

import { formatCurrency } from '../../helpers/currencies'
import { Account } from '../../model/model'
import { AccPlot } from '../../widgets/AccountPlots'
import { DivBody1 } from '../../widgets/generic/Typography'

interface Props {
    account: Account
    totalAmount: number[]
}

export function AccountCard({ account, totalAmount }: Props): ReactElement {
    const navigate = useNavigate()

    return (
        <a onClick={() => { navigate(`/accounts/${encodeURIComponent(account.name)}`) }}>
            <Paper variant={'outlined'}>
                <Box p={1}>
                    <Box display={'flex'} mb={1}>
                        <DivBody1>{account.name}</DivBody1>
                        <DivBody1 flex={'1 1 0'} textAlign={'right'} color={'primary.main'}>
                            {
                                formatCurrency(totalAmount[totalAmount.length - 1], account.currency)
                            }
                        </DivBody1>
                    </Box>
                    <AccPlot
                        sparkline
                        account={account}
                        perDayAmount={totalAmount.map((a, i, arr) => i === 0 ? 0 : a - arr[i - 1])}
                        totalAmount={totalAmount}
                    />
                </Box>
            </Paper>
        </a>
    )
}

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
