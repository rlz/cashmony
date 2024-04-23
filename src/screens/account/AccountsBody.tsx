import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, Fab, Skeleton, Stack, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { ReactElement, useEffect, useState } from 'react'

import { CustomTimeSpan } from '../../helpers/dates'
import { runAsync } from '../../helpers/smallTools'
import { AccountsModel } from '../../model/accounts'
import { AppState } from '../../model/appState'
import { Account } from '../../model/model'
import { calcStats2 } from '../../model/newStatsProcessor'
import { OperationsModel } from '../../model/operations'
import { PE } from '../../model/predicateExpression'
import { AccountsStatsReducer } from '../../model/stats/AccountsStatsReducer'
import { initGoogleSync } from '../../model/sync'
import { AddAccount } from '../../widgets/AddAccount'
import { Column } from '../../widgets/generic/Containers'
import { AccountCard, AccountCardSkeleton } from './AccountCard'

interface Props {
    noFab?: boolean
}

export const AccountsBody = observer(({ noFab }: Props): ReactElement => {
    const appState = AppState.instance()
    const accountsModel = AccountsModel.instance()
    const operationsModel = OperationsModel.instance()

    const [addAccount, setAddAccount] = useState(false)
    const [showHidden, setShowHidden] = useState(false)
    const [stats, setStats] = useState<AccountsStatsReducer | null>(null)

    useEffect(
        () => {
            runAsync(async () => {
                const r = new AccountsStatsReducer(appState.timeSpan, appState.masterCurrency)
                const lastOpDate = operationsModel.lastOp?.date ?? appState.timeSpan.endDate
                await calcStats2(
                    PE.any(),
                    new CustomTimeSpan(
                        operationsModel.firstOp?.date ?? appState.timeSpan.startDate,
                        lastOpDate > appState.timeSpan.endDate ? lastOpDate : appState.timeSpan.endDate
                    ),
                    appState.today,
                    [r]
                )
                setStats(r)
            })
        },
        [appState.masterCurrency, appState.timeSpan, operationsModel.operations]
    )

    if (accountsModel.accounts?.size === 0) {
        return (
            <>
                {
                    addAccount
                        ? (
                            <AddAccount
                                onClose={() => { setAddAccount(false) }}
                            />
                            )
                        : undefined
                }
                {
                    addAccount || noFab === true
                        ? undefined
                        : (
                            <Fab
                                color={'primary'}
                                sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                                onClick={() => { setAddAccount(true) }}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                            </Fab>
                            )
                }
                <Column textAlign={'center'} mt={3}>
                    {'Before start tracking your finances you need to create an account'}
                    <br />
                    {'Account is your bank account or cash'}
                    <br />
                    {'You can create as many accounts as you need'}
                    <Box my={2}>{'OR'}</Box>
                    {'If you have sync your data with Google before'}
                    <Box my={1}>
                        <Button variant={'contained'} onClick={() => { void initGoogleSync() }}>
                            {'Import data from Google'}
                        </Button>
                    </Box>
                </Column>
            </>
        )
    }

    if (
        accountsModel.accountsSorted === null
        || stats === null
    ) return <AccountsScreenSkeleton />

    const visibleAccounts: Account[] = []
    const hiddenAccounts: Account[] = []

    for (const a of accountsModel.accountsSorted.map(i => accountsModel.get(i))) {
        if (a.deleted === true) {
            continue
        }

        (a.hidden ? hiddenAccounts : visibleAccounts).push(a)
    }

    return (
        <>
            {
            addAccount
                ? (
                    <AddAccount
                        onClose={() => { setAddAccount(false) }}
                    />
                    )
                : undefined
        }
            {
            addAccount || noFab === true
                ? undefined
                : (
                    <Fab
                        color={'primary'}
                        sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                        onClick={() => { setAddAccount(true) }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </Fab>
                    )
        }
            <Box p={1} height={'100%'} overflow={'auto'}>
                <Box maxWidth={900} mx={'auto'}>
                    <Stack spacing={1}>
                        <AccountCard
                            total={true}
                            name={'Total'}
                            currency={appState.masterCurrency}
                            stats={stats.total}
                        />
                        {
                            visibleAccounts.map(account => (
                                <AccountCard
                                    key={account.name}
                                    name={account.name}
                                    currency={account.currency}
                                    stats={stats.accounts[account.name]}
                                />
                            ))
                        }
                        {
                            hiddenAccounts.length > 0
                                ? (showHidden
                                        ? hiddenAccounts.map(account => (
                                            <AccountCard
                                                key={account.name}
                                                name={account.name}
                                                currency={account.currency}
                                                stats={stats.accounts[account.name]}
                                            />
                                        ))
                                        : (
                                            <Typography color={'primary.main'} textAlign={'center'}>
                                                <a onClick={() => { setShowHidden(true) }}>
                                                    {'Show '}
                                                    {hiddenAccounts.length}
                                                    {' hidden'}
                                                </a>
                                            </Typography>
                                            ))
                                : null
}
                    </Stack>
                    <Box minHeight={144} />
                </Box>
            </Box>
        </>
    )
})

function AccountsScreenSkeleton(): ReactElement {
    return (
        <Column width={'100%'} p={1}>
            <Typography component={'div'} variant={'h6'} textAlign={'center'} my={1}>
                <Skeleton sx={{ maxWidth: 85, mx: 'auto' }} />
                <Typography variant={'body1'} color={'primary.main'}>
                    <Skeleton sx={{ maxWidth: 65, mx: 'auto' }} />
                </Typography>
            </Typography>
            <Box
                display={'flex'}
                flexDirection={'column'}
                gap={1}
                width={'100%'}
            >
                {[1, 1, 1].map((_, i) => <AccountCardSkeleton key={i} />)}
            </Box>
        </Column>
    )
}
