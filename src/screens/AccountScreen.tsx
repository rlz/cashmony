import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, Fab, FormControlLabel, Paper, Skeleton, Switch, Tab, Tabs, TextField, Typography, useTheme } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'
import { v1 as uuid } from 'uuid'

import { formatCurrency } from '../helpers/currencies'
import { deepEqual } from '../helpers/deepEqual'
import { nonNull, run, runAsync, showIfLazy } from '../helpers/smallTools'
import { screenWidthIs } from '../helpers/useWidth'
import { AccountsModel } from '../model/accounts'
import { AppState } from '../model/appState'
import { CurrenciesModel } from '../model/currencies'
import { type Account, type Operation } from '../model/model'
import { OperationsModel } from '../model/operations'
import { PE } from '../model/predicateExpression'
import { initGoogleSync } from '../model/sync'
import { AccPlot } from '../widgets/AccountPlots'
import { AddAccount } from '../widgets/AddAccount'
import { CurrencyInput } from '../widgets/CurrencyInput'
import { DeleteAccount } from '../widgets/DeleteAccount'
import { FullScreenModal } from '../widgets/FullScreenModal'
import { ActionButton, ActionFab } from '../widgets/generic/ActionButton'
import { Column } from '../widgets/generic/Containers'
import { ResizeHandle } from '../widgets/generic/resizeHandle'
import { DivBody1 } from '../widgets/generic/Typography'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'
import { OperationScreenBody } from './OperationScreen'

const appState = AppState.instance()
const accountsModel = AccountsModel.instance()
const operationsModel = OperationsModel.instance()

export function AccountScreen(): ReactElement {
    const appState = AppState.instance()
    const smallScreen = screenWidthIs('xs', 'sm')
    const location = useLocation()
    const theme = useTheme()
    const accSelected = location.pathname !== '/accounts'

    useEffect(() => {
        if (!accSelected) {
            appState.setSubTitle('Accounts')
            appState.setOnClose(null)
        }
    }, [accSelected])

    return <MainScreen>
        {
            !smallScreen
                ? <PanelGroup direction={'horizontal'}>
                    <Panel>
                        <AccountsScreenBody noFab={accSelected} />
                    </Panel>
                    {
                        showIfLazy(accSelected, () => {
                            return <>
                                <ResizeHandle />
                                <Panel>
                                    <AccountScreenBody />
                                </Panel>
                            </>
                        })
                    }
                </PanelGroup>
                : <Box height={'100%'} position={'relative'}>
                    <Box height={'100%'}>
                        <AccountsScreenBody noFab={accSelected} />
                    </Box>
                    {
                        showIfLazy(accSelected, () => {
                            return <Box
                                position={'absolute'}
                                top={0}
                                left={0}
                                height={'100%'}
                                width={'100%'}
                                bgcolor={theme.palette.background.default}
                                   >
                                <AccountScreenBody />
                            </Box>
                        })
                    }
                </Box>

        }
    </MainScreen>
}

export const AccountScreenBody = observer(() => {
    const [accName, tabName, opId] = run(() => {
        const params = useParams()
        const accName = nonNull(params.accName, 'accName expected here')
        const opId = params.opId
        if (opId !== undefined) {
            return [accName, 'operations', opId]
        }

        const tabName = params.tabName ?? 'stats'
        return [accName, tabName, null]
    })

    const [acc, setAcc] = useState<Account | null>(null)
    const navigate = useNavigate()

    const [opModalTitle, setOpModalTitle] = useState('')

    useEffect(() => {
        appState.setOnClose(() => {
            navigate('/accounts')
        })
    }, [])

    useEffect(() => {
        if (accountsModel.accounts === null) {
            return
        }

        const account = accountsModel.get(accName)
        setAcc(account)
    }, [accName, accountsModel.accounts])

    useEffect(() => {
        appState.setSubTitle(`Accounts :: ${acc?.name ?? 'Loading...'}`)
    }, [acc?.name])

    const [perDayAmount, totalAmount] = useMemo(() => {
        if (accountsModel.amounts === null) {
            return [[], []]
        }

        const timeSpan = appState.timeSpan

        const allDates = [...timeSpan.allDates({ includeDayBefore: true })]

        const totalAmount = allDates.map(d => accountsModel.getAmounts(d)[accName] ?? 0)

        const perDayAmount = totalAmount.map((a, i, arr) => i === 0 ? 0 : a - arr[i - 1])

        return [perDayAmount, totalAmount]
    }, [accName, accountsModel.amounts, appState.timeSpanInfo])

    if (
        acc === null
        || accountsModel.accounts === null
        || accountsModel.amounts === null
    ) {
        return <AccountScreenSkeleton />
    }

    const cur = (amount: number, compact = false): string => formatCurrency(amount, acc.currency, compact)

    return <>
        <Column height={'100%'}>
            <Box p={1}>
                <Typography variant={'h6'} textAlign={'center'} mt={1}>
                    {acc.name}
                </Typography>
                <Typography variant={'h6'} textAlign={'center'} color={'primary.main'} mb={1}>
                    {cur(totalAmount[totalAmount.length - 1])}
                </Typography>
                <Tabs
                    value={tabName}
                    onChange={(_, tab) => { navigate(`/accounts/${encodeURIComponent(accName)}/${tab as string}`) }}
                    variant={'fullWidth'}
                >
                    <Tab value={'stats'} label={'Stats'} />
                    <Tab value={'modify'} label={'Modify'} />
                    <Tab value={'operations'} label={'Operations'} />
                </Tabs>
            </Box>
            <Box overflow={'auto'} flex={'1 1 auto'}>
                <Box px={1}>
                    {
                        match(tabName)
                            .with('stats', () => <Stats account={acc} perDayAmount={perDayAmount} totalAmount={totalAmount} />)
                            .with('modify', () => <Editor acc={acc} setAcc={setAcc} />)
                            .with('operations', () => <OpsList
                                noFab
                                onOpClick={(opId) => {
                                    navigate(`/accounts/${accName}/operations/${opId}`)
                                }}
                                predicate={PE.and(PE.filter(appState.filter), PE.account(acc.name))}
                                                      />)
                            .otherwise(() => { throw Error('Unimplemented tab') })
                    }
                    <Box minHeight={72} />
                </Box>
            </Box>
        </Column>
        {
            showIfLazy(opId !== null, () => {
                return <FullScreenModal
                    width={'850px'}
                    title={opModalTitle}
                    onClose={() => { navigate(`/accounts/${accName}/operations`) }}
                       >
                    <Box p={1}>
                        <OperationScreenBody
                            urlOpId={opId ?? ''}
                            setModalTitle={setOpModalTitle}
                        />
                    </Box>
                </FullScreenModal>
            })
        }
    </>
})

function AccountScreenSkeleton(): ReactElement {
    return <>
        <Typography variant={'h6'} mt={2}>
            <Skeleton width={75} sx={{ mx: 'auto' }} />
        </Typography>
        <Typography variant={'h6'} textAlign={'center'} color={'primary.main'} mb={1}>
            <Skeleton width={95} sx={{ mx: 'auto' }} />
        </Typography>
        <Tabs value={0} variant={'fullWidth'}>
            <Tab label={<Skeleton width={45} />} />
            <Tab label={<Skeleton width={65} />} />
            <Tab label={<Skeleton width={35} />} />
        </Tabs>
        <Column gap={1} mt={1}>
            <Skeleton variant={'rounded'} height={185} />
            <Skeleton variant={'rounded'} height={200} />
            <Skeleton variant={'rounded'} height={180} />
        </Column>
    </>
}

interface StatsProps {
    account: Account
    perDayAmount: number[]
    totalAmount: number[]
}

function Stats({ account, perDayAmount, totalAmount }: StatsProps): ReactElement {
    return <Box display={'flex'} flexDirection={'column'} gap={1} mt={1}>
        <AccPlot title={'Amount'} account={account} totalAmount={totalAmount} />
        <AccPlot title={'Per day amount'} account={account} perDayAmount={perDayAmount} />
    </Box>
}

interface EditorProps {
    acc: Account
    setAcc: (cat: Account) => void
}

function Editor({ acc, setAcc }: EditorProps): ReactElement {
    const navigate = useNavigate()
    const amount = accountsModel.getAmounts(appState.today)[acc.name] ?? 0

    const [adjustedAmount, setAdjustedAmount] = useState(amount)

    const [delOpen, setDelOpen] = useState(false)
    const [newAcc, setNewAcc] = useState(acc)

    useEffect(() => { setNewAcc(acc) }, [acc])

    const trimmedName = newAcc.name.trim()
    const nameConflict = trimmedName !== acc.name
        && accountsModel.accounts !== null
        && accountsModel.accounts.has(newAcc.name)
        && accountsModel.get(newAcc.name).deleted !== true

    const onSave = useMemo(
        () => {
            if (
                deepEqual(acc, newAcc)
                || trimmedName === ''
                || nameConflict
            ) {
                return null
            }

            return async () => {
                await accountsModel.put({ ...newAcc, name: trimmedName, lastModified: DateTime.utc() })

                if (operationsModel.operations === null) {
                    throw Error('Operations not loaded')
                }

                if (trimmedName !== acc.name) {
                    const changedOps: Operation[] = []
                    for (const op of operationsModel.operations) {
                        if (
                            (op.type !== 'deleted')
                            && op.account.name === acc.name
                        ) {
                            changedOps.push({
                                ...op,
                                lastModified: DateTime.utc(),
                                account: {
                                    ...op.account,
                                    name: trimmedName
                                }
                            })
                        }
                    }
                    await operationsModel.put(changedOps)
                    await accountsModel.put({ ...acc, deleted: true, lastModified: DateTime.utc() })
                    navigate(`/accounts/${encodeURIComponent(trimmedName)}`)
                    return
                }

                setAcc(newAcc)
            }
        },
        [
            acc,
            newAcc,
            accountsModel.accounts
        ]
    )

    return <Box mt={1}>
        <TextField
            error={trimmedName === '' || nameConflict}
            helperText={match(null)
                .when(() => trimmedName === '', () => 'Black name')
                .when(() => nameConflict, () => 'Already exists')
                .otherwise(() => 'Ok')}
            label={'Name'}
            size={'small'}
            fullWidth
            variant={'filled'}
            value={newAcc.name}
            onChange={(ev) => { setNewAcc({ ...newAcc, name: ev.target.value }) }}
        />
        <FormControlLabel
            control={<Switch
                checked={newAcc.hidden}
                onChange={(_, checked) => {
                    setNewAcc({
                        ...newAcc,
                        hidden: checked
                    })
                }}
                     />}
            label={'Hidden'}
        />
        <Box my={4}>
            <CurrencyInput
                label={'Adjust amount'}
                currency={newAcc.currency}
                amount={adjustedAmount}
                onAmountChange={(amount) => { setAdjustedAmount(amount) }}
            />
            <ActionButton
                sx={{ mt: 1 }}
                action={
                    amount === adjustedAmount
                        ? null
                        : async () => {
                            await operationsModel.put([{
                                id: uuid(),
                                lastModified: DateTime.utc(),
                                date: appState.today,
                                type: 'adjustment',
                                currency: acc.currency,
                                amount: adjustedAmount - amount,
                                account: {
                                    name: acc.name,
                                    amount: adjustedAmount - amount
                                },
                                tags: [],
                                comment: null
                            }])
                        // eslint-disable-next-line @stylistic/jsx-indent
                        }
                }
                variant={'contained'}
                fullWidth
            >
                {'Adjust'}
            </ActionButton>
        </Box>
        <ActionFab action={onSave}>
            <FontAwesomeIcon icon={faCheck} />
        </ActionFab>
        <Button
            variant={'contained'}
            color={'error'}
            onClick={() => { setDelOpen(true) }}
            fullWidth
        >
            {'Delete'}
        </Button>
        <DeleteAccount name={acc.name} open={delOpen} setOpen={setDelOpen} />
    </Box>
}

interface AccountsScreenBodyProps {
    noFab?: boolean
}

export const AccountsScreenBody = observer(({ noFab }: AccountsScreenBodyProps): ReactElement => {
    const [addAccount, setAddAccount] = useState(false)
    const [showHidden, setShowHidden] = useState(false)
    const [total, setTotal] = useState<number | null>(null)

    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    const accountsModel = AccountsModel.instance()

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
        return <>
            {
                addAccount
                    ? <AddAccount
                            onClose={() => { setAddAccount(false) }}
                      />
                    : undefined
            }
            {
                addAccount || noFab === true
                    ? undefined
                    : <Fab
                            color={'primary'}
                            sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                            onClick={() => { setAddAccount(true) }}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                    </Fab>
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

    return <>
        {
            addAccount
                ? <AddAccount
                        onClose={() => { setAddAccount(false) }}
                  />
                : undefined
        }
        {
            addAccount || noFab === true
                ? undefined
                : <Fab
                        color={'primary'}
                        sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                        onClick={() => { setAddAccount(true) }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                </Fab>
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
                        visibleAccounts.map(account => <AccountCard
                            key={account.name}
                            account={account}
                            totalAmount={totalAmounts.map(a => a[account.name] ?? 0)}
                                                       />)
                    }
                    { hiddenAccounts.length > 0
                        ? (showHidden
                                ? hiddenAccounts.map(account => <AccountCard
                                        key={account.name}
                                        account={account}
                                        totalAmount={totalAmounts.map(a => a[account.name] ?? 0)}
                                                                />)
                                : <Typography color={'primary.main'} textAlign={'center'}>
                                    <a onClick={() => { setShowHidden(true) }}>
                                        {'Show '}
                                        {hiddenAccounts.length}
                                        {' hidden'}
                                    </a>
                                </Typography>)
                        : null}
                </Box>
                <Box minHeight={144} />
            </Box>
        </Box>
    </>
})

function AccountsScreenSkeleton(): ReactElement {
    return <Column width={'100%'} p={1}>
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
}

interface AccountPanelProps {
    account: Account
    totalAmount: number[]
}

function AccountCard({ account, totalAmount }: AccountPanelProps): ReactElement {
    const navigate = useNavigate()

    return <a onClick={() => { navigate(`/accounts/${encodeURIComponent(account.name)}`) }}>
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
}

function AccountCardSkeleton(): ReactElement {
    return <Paper sx={{ p: 1, maxWidth: 900, mx: 'auto', width: '100%' }}>
        <Box display={'flex'} mb={1}>
            <DivBody1 flex={'1 1 0'}><Skeleton sx={{ maxWidth: 85 }} /></DivBody1>
            <DivBody1 textAlign={'right'} color={'primary.main'}>
                <Skeleton sx={{ minWidth: 55 }} />
            </DivBody1>
        </Box>
        <Skeleton variant={'rectangular'} height={50} />
    </Paper>
}
