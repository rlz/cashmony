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
import { type Account } from '../model/model'
import { useNavigate } from 'react-router-dom'
import { AccPlot } from '../widgets/AccountPlots'

const accountsModel = AccountsModel.instance()
const appState = AppState.instance()

export const AccountsScreen = observer((): ReactElement => {
    const [addAccount, setAddAccount] = useState(false)
    const [showHidden, setShowHidden] = useState(false)

    const totalAmounts = [...appState.timeSpan.allDates({ includeDayBefore: true })].map(d => accountsModel.getAmounts(d))

    const visibleAccounts: Account[] = []
    const hiddenAccounts: Account[] = []

    for (const a of accountsModel.accountsSorted.map(i => accountsModel.get(i))) {
        if (a.deleted === true) {
            continue
        }

        (a.hidden ? hiddenAccounts : visibleAccounts).push(a)
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
            { visibleAccounts.map(account => <AccountPanel
                key={account.name}
                account={account}
                totalAmount={totalAmounts.map(a => a.get(account.name) ?? 0)}
            />) }
        </Box>
        { hiddenAccounts.length > 0
            ? (showHidden
                ? hiddenAccounts.map(account => <AccountPanel
                    key={account.name}
                    account={account}
                    totalAmount={totalAmounts.map(a => a.get(account.name) ?? 0)}
                />)
                : <Typography color="primary.main" textAlign="center">
                    <a onClick={() => { setShowHidden(true) }}>Show {hiddenAccounts.length} hidden</a>
                </Typography>)
            : null
        }
        <Box minHeight={144}/>
    </MainScreen>
})

interface AccountPanelProps {
    account: Account
    totalAmount: number[]
}

function AccountPanel ({ account, totalAmount }: AccountPanelProps): ReactElement {
    const navigate = useNavigate()

    return <a onClick={() => { navigate(`/accounts/${encodeURIComponent(account.name)}`) }}>
        <Paper
            key={account.name}
            sx={{ p: 1 }}
        >
            <Typography component='div' display='flex' mb={1}>
                <Box>{account.name}</Box>
                <Box flex="1 1 0" textAlign='right'>
                    {
                        formatCurrency(totalAmount[totalAmount.length - 1], account.currency)
                    }
                </Box>
            </Typography>
            <AccPlot
                sparkline
                account={account}
                perDayAmount={totalAmount.map((a, i, arr) => i === 0 ? 0 : a - arr[i - 1])}
                totalAmount={totalAmount}
            />
        </Paper>
    </a>
}
