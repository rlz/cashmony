import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, Fab, Skeleton, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { ReactElement, useEffect, useState } from 'react'

import { formatCurrency } from '../../helpers/currencies'
import { runAsync } from '../../helpers/smallTools'
import { AccountsModel } from '../../model/accounts'
import { AppState } from '../../model/appState'
import { CurrenciesModel } from '../../model/currencies'
import { Account } from '../../model/model'
import { initGoogleSync } from '../../model/sync'
import { AddAccount } from '../../widgets/AddAccount'
import { Column } from '../../widgets/generic/Containers'
import { AccountCard, AccountCardSkeleton } from './AccountCard'

interface Props {
    noFab?: boolean
}

export const AccountsBody = observer(({ noFab }: Props): ReactElement => {
    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    const accountsModel = AccountsModel.instance()

    const [addAccount, setAddAccount] = useState(false)
    const [showHidden, setShowHidden] = useState(false)
    const [total, setTotal] = useState<number | null>(null)

    useEffect(() => {
        runAsync(async () => {
            if (accountsModel.amounts === null) {
                return
            }

            const lastDate = (() => {
                const dt = appState.timeSpan.endDate
                return dt > appState.today ? appState.today : dt
            })()
            const amounts = accountsModel.getAmounts(lastDate)

            const results = [...Object.entries(amounts)].map(async ([accName, amount]) => {
                const rate = await currenciesModel.getRate(
                    lastDate,
                    accountsModel.get(accName).currency,
                    appState.masterCurrency
                )

                return amount * rate
            })

            setTotal((await Promise.all(results)).reduce((partialSum, a) => partialSum + a, 0))
        })
    }, [appState.masterCurrency, accountsModel.amounts])

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
        || total === null
    ) return <AccountsScreenSkeleton />

    const totalAmounts = [...appState.timeSpan.allDates({ includeDayBefore: true })].map(d => accountsModel.getAmounts(d))

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
                    <Typography component={'div'} variant={'h6'} textAlign={'center'} my={1}>
                        {'Total'}
                        <Typography variant={'body1'} color={'primary.main'}>
                            {formatCurrency(total, appState.masterCurrency)}
                        </Typography>
                    </Typography>
                    <Box
                        display={'flex'}
                        flexDirection={'column'}
                        gap={1}
                    >
                        {
                        visibleAccounts.map(account => (
                            <AccountCard
                                key={account.name}
                                account={account}
                                totalAmount={totalAmounts.map(a => a[account.name] ?? 0)}
                            />
                        ))
                    }
                        { hiddenAccounts.length > 0
                            ? (showHidden
                                    ? hiddenAccounts.map(account => (
                                        <AccountCard
                                            key={account.name}
                                            account={account}
                                            totalAmount={totalAmounts.map(a => a[account.name] ?? 0)}
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
                            : null}
                    </Box>
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
