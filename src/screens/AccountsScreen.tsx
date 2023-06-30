import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement } from 'react'
import { AccountsModel } from '../model/accounts'
import { Box, Fab, Paper, Skeleton, Typography } from '@mui/material'
import { AppState } from '../model/appState'
import { formatCurrency } from '../helpers/currencies'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { AddAccount } from '../widgets/AddAccount'
import { type Account } from '../model/model'
import { useNavigate } from 'react-router-dom'
import { AccPlot } from '../widgets/AccountPlots'
import { run } from '../helpers/smallTools'
import { CurrenciesModel } from '../model/currencies'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { DivBody1 } from '../widgets/Typography'

export const AccountsScreen = observer((): ReactElement => {
    const [addAccount, setAddAccount] = useState(false)
    const [showHidden, setShowHidden] = useState(false)

    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    const accountsModel = AccountsModel.instance()

    if (currenciesModel.rates === null) return <AccountsScreenSkeleton />

    const totalAmounts = [...appState.timeSpan.allDates({ includeDayBefore: true })].map(d => accountsModel.getAmounts(d))

    const total = run((): number => {
        let result = 0
        for (const [accName, amount] of totalAmounts[totalAmounts.length - 1]) {
            result += amount * currenciesModel.getRate(
                appState.timeSpan.endDate,
                accountsModel.get(accName).currency,
                appState.masterCurrency
            )
        }
        return result
    })

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
        <Box p={1}>
            <Typography component="div" variant='h6' textAlign="center" my={1}>
            Total
                <Typography variant='body1' color="primary.main">
                    {formatCurrency(total, appState.masterCurrency)}
                </Typography>
            </Typography>
            <Box
                display="flex"
                flexDirection="column"
                gap={1}
            >
                {
                    visibleAccounts.map(account => <AccountCard
                        key={account.name}
                        account={account}
                        totalAmount={totalAmounts.map(a => a.get(account.name) ?? 0)}
                    />)
                }
                { hiddenAccounts.length > 0
                    ? (showHidden
                        ? hiddenAccounts.map(account => <AccountCard
                            key={account.name}
                            account={account}
                            totalAmount={totalAmounts.map(a => a.get(account.name) ?? 0)}
                        />)
                        : <Typography color="primary.main" textAlign="center">
                            <a onClick={() => { setShowHidden(true) }}>Show {hiddenAccounts.length} hidden</a>
                        </Typography>)
                    : null
                }
            </Box>
            <Box minHeight={144}/>
        </Box>
    </MainScreen>
})

function AccountsScreenSkeleton (): ReactElement {
    return <MainScreen>
        <Typography component="div" variant='h6' textAlign="center" my={1}>
            <Skeleton sx={{ maxWidth: 85, mx: 'auto' }}/>
            <Typography variant='body1' color="primary.main">
                <Skeleton sx={{ maxWidth: 65, mx: 'auto' }}/>
            </Typography>
        </Typography>
        <Box
            display="flex"
            flexDirection="column"
            gap={1}
        >
            {[1, 1, 1].map((_, i) => <AccountCardSkeleton key={i}/>)}
        </Box>
    </MainScreen>
}

interface AccountPanelProps {
    account: Account
    totalAmount: number[]
}

function AccountCard ({ account, totalAmount }: AccountPanelProps): ReactElement {
    const navigate = useNavigate()

    return <a onClick={() => { navigate(`/accounts/${encodeURIComponent(account.name)}`) }}>
        <Paper
            sx={{ p: 1 }}
        >
            <Box display='flex' mb={1}>
                <DivBody1>{account.name}</DivBody1>
                <DivBody1 flex="1 1 0" textAlign='right' color='primary.main'>
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
        </Paper>
    </a>
}

function AccountCardSkeleton (): ReactElement {
    return <Paper sx={{ p: 1 }}>
        <Box display='flex' mb={1}>
            <DivBody1 flex="1 1 0"><Skeleton sx={{ maxWidth: 85 }}/></DivBody1>
            <DivBody1 textAlign='right' color='primary.main'>
                <Skeleton sx={{ minWidth: 55 }} />
            </DivBody1>
        </Box>
        <Skeleton variant='rectangular' height={50}/>
    </Paper>
}
