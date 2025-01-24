import { Box, Paper, Stack } from '@mui/material'
import { CSSProperties, ReactElement } from 'react'

import { CURRENCIES } from '../../../currencies/currenciesList'
import { Account } from '../../../engine/model'
import { TotalAndChangeStats } from '../../../engine/stats/model'
import { formatCurrency } from '../../helpers/currencies'
import { AccountChangePlot } from '../../widgets/plots/AccountChangePlot'
import { AccountTotalPlot } from '../../widgets/plots/AccountTotalPlot'

interface Props {
    currencies: Record<string, number> | null
    account: Account
    stats: TotalAndChangeStats
}

const currencyTdStyle: CSSProperties = {
    textAlign: 'right'
}

export function AccountStatsBody({ currencies, account, stats }: Props): ReactElement {
    return (
        <Box display={'flex'} flexDirection={'column'} gap={1} mt={1}>
            {
                currencies !== null
                && (
                    <Paper variant={'outlined'}>
                        <Stack p={1} direction={'column'} gap={1} flexWrap={'wrap'}>
                            <table>
                                <tbody>
                                    {
                                        Object.entries(currencies).map(([c, v]) => {
                                            const info = CURRENCIES[c]
                                            return (
                                                <tr>
                                                    <th>
                                                        {info.name_plural}
                                                    </th>
                                                    <td style={currencyTdStyle}>
                                                        {formatCurrency(v, c)}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>
                        </Stack>
                    </Paper>
                )
            }
            <AccountTotalPlot stats={stats} currency={account.currency} />
            <AccountChangePlot stats={stats} currency={account.currency} />
        </Box>
    )
}
