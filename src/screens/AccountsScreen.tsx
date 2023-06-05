import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement } from 'react'
import { AccountsModel } from '../model/accounts'
import { MainScreen } from '../widgets/MainScreen'
import { Box, Fab, Paper, Typography } from '@mui/material'
import { AppState } from '../model/appState'
import { formatCurrency } from '../helpers/currencies'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { AddAccount } from '../widgets/AddAccount'

const accountsModel = AccountsModel.instance()
const appState = AppState.instance()

export const AccountsScreen = observer((): ReactElement => {
    const [addAccount, setAddAccount] = useState(false)

    const date = appState.timeSpan.endDate
    const amounts = accountsModel.getAmounts(date)

    if (amounts === undefined) {
        throw Error('amounts expected here')
    }

    return <MainScreen>
        {
            addAccount
                ? <AddAccount
                    onClose={() => { setAddAccount(false) }}
                />
                : <Fab
                    color="primary"
                    sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                    onClick={() => { setAddAccount(true) }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                </Fab>

        }
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
        <Box minHeight={144}/>
    </MainScreen>
})
