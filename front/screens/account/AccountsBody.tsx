import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Fab, Skeleton, Stack, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { ReactElement, useEffect, useState } from 'react'

import { CustomTimeSpan } from '../../../engine/dates'
import { Account } from '../../../engine/model'
import { PE } from '../../../engine/predicateExpression'
import { AccountsStatsReducer } from '../../../engine/stats/AccountsStatsReducer'
import { calcStats2 } from '../../../engine/stats/newStatsProcessor'
import { runAsync } from '../../helpers/smallTools'
import { useFrontState } from '../../model/FrontState'
import { useCurrenciesLoader } from '../../useCurrenciesLoader'
import { useEngine } from '../../useEngine'
import { Column } from '../../widgets/generic/Containers'
import { AddAccount } from './AccountAdd'
import { AccountCard, AccountCardSkeleton } from './AccountCard'

interface Props {
    noFab?: boolean
}

export const AccountsBody = observer(({ noFab }: Props): ReactElement => {
    const appState = useFrontState()
    const engine = useEngine()
    const currenciesLoader = useCurrenciesLoader()

    const [addAccount, setAddAccount] = useState(false)
    const [showHidden, setShowHidden] = useState(false)
    const [stats, setStats] = useState<AccountsStatsReducer | null>(null)

    useEffect(
        () => {
            runAsync(async () => {
                const r = new AccountsStatsReducer(
                    Object.fromEntries(engine.accounts.map(a => [a.id, a.currency])),
                    currenciesLoader,
                    appState.timeSpan,
                    appState.masterCurrency,
                    engine,
                    appState.today
                )
                const firstOpDate = engine.firstOp?.date ?? appState.timeSpan.startDate
                const lastOpDate = engine.lastOp?.date ?? appState.timeSpan.endDate
                await calcStats2(
                    engine,
                    PE.any(),
                    new CustomTimeSpan(
                        firstOpDate < appState.timeSpan.startDate ? firstOpDate : appState.timeSpan.startDate,
                        lastOpDate > appState.timeSpan.endDate ? lastOpDate : appState.timeSpan.endDate
                    ),
                    appState.today,
                    [r]
                )
                setStats(r)
            })
        },
        [appState.masterCurrency, appState.timeSpan, engine.operations]
    )

    if (engine.accounts.length === 0) {
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
                </Column>
            </>
        )
    }

    if (stats === null) {
        return <AccountsScreenSkeleton />
    }

    const visibleAccounts: Account[] = []
    const hiddenAccounts: Account[] = []

    for (const a of engine.accountsSortedByUsage) {
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
                            id={'_total'}
                            total={true}
                            name={'Total'}
                            currency={appState.masterCurrency}
                            stats={stats.total}
                        />
                        {
                            visibleAccounts.map(account => (
                                <AccountCard
                                    key={account.id}
                                    id={account.id}
                                    name={account.name}
                                    currency={account.currency}
                                    stats={stats.accounts[account.id]}
                                />
                            ))
                        }
                        {
                            hiddenAccounts.length > 0
                                ? (showHidden
                                        ? hiddenAccounts.map(account => (
                                            <AccountCard
                                                key={account.id}
                                                id={account.id}
                                                name={account.name}
                                                currency={account.currency}
                                                stats={stats.accounts[account.id]}
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
