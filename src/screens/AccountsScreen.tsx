import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { AccountsModel } from '../model/accounts'
import { MainScreen } from '../widgets/MainScreen'
import { Box, Paper, Typography } from '@mui/material'
import { AppState } from '../model/appState'
import { formatCurrency } from '../helpers/currencies'

const accountsModel = AccountsModel.instance()
const appState = AppState.instance()

export const AccountsScreen = observer((): ReactElement => {
    const date = appState.startDate
    const amounts = accountsModel.amounts.get(date.toISODate() ?? '')

    if (amounts === undefined) {
        throw Error('amounts expected here')
    }

    return <MainScreen>
        <Box
            display="flex"
            flexDirection="column"
            gap={1}
            p={1}
        >
            { accountsModel.accountsSorted.map(a => accountsModel.get(a)).map(account => {
                return <Paper
                    key={account.name}
                    sx={{ p: 1 }}
                >
                    <Typography>
                        {account.name}<br/>{formatCurrency(amounts.get(account.name) ?? 0, account.currency)}
                    </Typography>
                </Paper>
            }) }
        </Box>
    </MainScreen>
})
