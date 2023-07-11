import { faCheck, faChevronDown, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Button, FormControlLabel, Skeleton, Switch, Tab, Tabs, TextField, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'
import { v1 as uuid } from 'uuid'

import { formatCurrency } from '../helpers/currencies'
import { deepEqual } from '../helpers/deepEqual'
import { nonNull, run, showIfLazy } from '../helpers/smallTools'
import { screenWidthIs } from '../helpers/useWidth'
import { AccountsModel } from '../model/accounts'
import { AppState } from '../model/appState'
import { type Account, type Operation } from '../model/model'
import { OperationsModel } from '../model/operations'
import { Operations } from '../model/stats'
import { AccPlot } from '../widgets/AccountPlots'
import { CurrencyInput } from '../widgets/CurrencyInput'
import { DeleteAccount } from '../widgets/DeleteAccount'
import { FullScreenModal } from '../widgets/FullScreenModal'
import { ActionFab } from '../widgets/generic/ActionButton'
import { Column } from '../widgets/generic/Containers'
import { ResizeHandle } from '../widgets/generic/resizeHandle'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'
import { AccountsScreenBody } from './AccountsScreen'
import { OperationScreenBody } from './OperationScreen'

const appState = AppState.instance()
const accountsModel = AccountsModel.instance()
const operationsModel = OperationsModel.instance()

export function AccountScreen (): ReactElement {
    const navigate = useNavigate()
    const smallScreen = screenWidthIs('xs', 'sm')

    useEffect(() => {
        appState.setOnClose(() => {
            navigate('/accounts')
        })
    }, [])

    return <MainScreen>
        {
            !smallScreen
                ? <PanelGroup direction='horizontal'>
                    <Panel>
                        <AccountsScreenBody noFab/>
                    </Panel>
                    <ResizeHandle />
                    <Panel>
                        <AccountScreenBody />
                    </Panel>
                </PanelGroup>
                : <AccountScreenBody />
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
    const [newAcc, setNewAcc] = useState<Account | null>(null)
    const navigate = useNavigate()

    const [opModalTitle, setOpModalTitle] = useState('')

    useEffect(() => {
        if (accountsModel.accounts === null) {
            return
        }

        const account = accountsModel.get(accName)
        setAcc(account)
        setNewAcc(account)
    }, [accName, accountsModel.accounts])

    useEffect(() => {
        appState.setSubTitle(`Accounts :: ${newAcc?.name ?? 'Loading...'}`)
    }, [newAcc?.name])

    const [perDayAmount, totalAmount] = useMemo(() => {
        if (accountsModel.amounts === null) {
            return [[], []]
        }

        const timeSpan = appState.timeSpan

        const allDates = [...timeSpan.allDates({ includeDayBefore: true })]

        const totalAmount = allDates.map((d) => accountsModel.getAmounts(d).get(accName) ?? 0)

        const perDayAmount = totalAmount.map((a, i, arr) => i === 0 ? 0 : a - arr[i - 1])

        return [perDayAmount, totalAmount]
    }, [accName, accountsModel.amounts, appState.timeSpanInfo])

    if (
        acc === null ||
        newAcc === null ||
        accountsModel.accounts === null ||
        accountsModel.amounts === null
    ) {
        return <AccountScreenSkeleton />
    }

    const cur = (amount: number, compact = false): string => formatCurrency(amount, acc.currency, compact)

    return <>
        <Column height='100%'>
            <Box p={1}>
                <Typography variant='h6' textAlign='center' mt={1}>
                    {newAcc.name.trim() === '' ? '-' : newAcc.name}
                </Typography>
                <Typography variant='h6' textAlign='center' color='primary.main' mb={1}>
                    {cur(totalAmount[totalAmount.length - 1])}
                </Typography>
                <Tabs value={tabName} onChange={(_, tab) => { navigate(`/accounts/${encodeURIComponent(accName)}/${tab as string}`) }} variant='fullWidth'>
                    <Tab value='stats' label='Stats'/>
                    <Tab value='modify' label='Modify'/>
                    <Tab value='operations' label='Operations'/>
                </Tabs>
            </Box>
            <Box overflow='scroll' flex='1 1 auto'>
                <Box px={1}>
                    {
                        match(tabName)
                            .with('stats', () => <Stats account={acc} perDayAmount={perDayAmount} totalAmount={totalAmount} />)
                            .with('modify', () => <Editor acc={acc} newAcc={newAcc} setNewAcc={setNewAcc}/>)
                            .with('operations', () => <OpsList
                                noFab
                                onOpClick={(opId) => {
                                    navigate(`/accounts/${accName}/operations/${opId}`)
                                }}
                                operations={Operations.forFilter(appState.filter).forTimeSpan(appState.timeSpan).keepAccounts(acc.name)}
                            />)
                            .otherwise(() => { throw Error('Unimplemented tab') })
                    }
                    <Box minHeight={72}/>
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
                            opId={opId ?? ''}
                            setModalTitle={setOpModalTitle}
                        />
                    </Box>
                </FullScreenModal>
            })
        }
    </>
})

function AccountScreenSkeleton (): ReactElement {
    return <>
        <Typography variant='h6' mt={2}>
            <Skeleton width={75} sx={{ mx: 'auto' }} />
        </Typography>
        <Typography variant='h6' textAlign='center' color='primary.main' mb={1}>
            <Skeleton width={95} sx={{ mx: 'auto' }} />
        </Typography>
        <Tabs value={0} variant='fullWidth'>
            <Tab label={<Skeleton width={45} />}/>
            <Tab label={<Skeleton width={65}/>}/>
            <Tab label={<Skeleton width={35}/>}/>
        </Tabs>
        <Column gap={1} mt={1}>
            <Skeleton variant='rounded' height={185}/>
            <Skeleton variant='rounded' height={200}/>
            <Skeleton variant='rounded' height={180}/>
        </Column>
    </>
}

interface StatsProps {
    account: Account
    perDayAmount: number[]
    totalAmount: number[]
}

function Stats ({ account, perDayAmount, totalAmount }: StatsProps): ReactElement {
    return <Box display='flex' flexDirection='column' gap={1} mt={1}>
        <AccPlot title='Amount' account={account} totalAmount={totalAmount} />
        <AccPlot title='Per day amount' account={account} perDayAmount={perDayAmount}/>
    </Box>
}

interface EditorProps {
    acc: Account
    newAcc: Account
    setNewAcc: (cat: Account) => void
}

function Editor ({ acc, newAcc, setNewAcc }: EditorProps): ReactElement {
    const navigate = useNavigate()
    const [open, setOpen] = useState<'name' | 'goal' | null>(null)
    const amount = accountsModel.getAmounts(appState.today).get(acc.name) ?? 0
    const [adjustedAmount, setAdjustedAmount] = useState(amount)
    const [adjInProgress, setAdjInProgress] = useState(false)
    const [delOpen, setDelOpen] = useState(false)

    const onSave = useMemo(
        () => {
            if (
                acc === null ||
                newAcc === null ||
                accountsModel.accounts === null ||
                deepEqual(acc, newAcc) ||
                newAcc.name.trim() === '' ||
                (
                    newAcc.name !== acc.name &&
                    accountsModel.accounts.has(newAcc.name) &&
                    accountsModel.get(newAcc.name).deleted !== true
                )
            ) {
                return null
            }

            return async () => {
                await accountsModel.put({ ...newAcc, lastModified: DateTime.utc() })

                if (newAcc.name !== acc.name) {
                    const changedOps: Operation[] = []
                    for (const op of operationsModel.operations) {
                        if (
                            (op.type !== 'deleted') &&
                        op.account.name === acc.name
                        ) {
                            changedOps.push({
                                ...op,
                                lastModified: DateTime.utc(),
                                account: {
                                    ...op.account,
                                    name: newAcc.name
                                }
                            })
                        }
                    }
                    await operationsModel.put(changedOps)
                    await accountsModel.put({ ...acc, deleted: true, lastModified: DateTime.utc() })
                    navigate(`/accounts/${encodeURIComponent(newAcc.name)}`)
                }
            }
        },
        [
            acc,
            newAcc,
            accountsModel.accounts
        ]
    )

    return <Box mt={1}>
        <Accordion
            disableGutters
            expanded={open === 'name'}
            onChange={(_, expanded) => {
                setOpen(expanded ? 'name' : null)
            }}
        >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
                <Typography>Name</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <TextField
                    error={
                        newAcc.name !== acc.name &&
                        accountsModel.accounts?.has(newAcc.name) === true &&
                        accountsModel.get(newAcc.name).deleted !== true
                    }
                    label='Name'
                    size='small'
                    fullWidth
                    variant='filled'
                    value={newAcc.name}
                    onChange={ev => { setNewAcc({ ...newAcc, name: ev.target.value }) }}
                />
            </AccordionDetails>
        </Accordion>
        <Accordion
            disableGutters
            expanded={open === 'goal'}
            onChange={(_, expanded) => {
                setOpen(expanded ? 'goal' : null)
            }}
        >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
                <Typography>Current Amount</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <CurrencyInput
                    label='Amount'
                    currency={newAcc.currency}
                    amount={adjustedAmount}
                    onAmountChange={amount => { setAdjustedAmount(amount) }}
                />
            </AccordionDetails>
            <AccordionActions>
                <Button
                    disabled={amount === adjustedAmount || adjInProgress}
                    onClick={() => {
                        setAdjInProgress(true)
                        setTimeout(() => {
                            const run = async (): Promise<void> => {
                                try {
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
                                } finally {
                                    setAdjInProgress(false)
                                }
                            }

                            void run()
                        })
                    }}
                    variant='contained'
                    size='small'
                    fullWidth
                    sx={{ gap: 1 }}
                >
                    {adjInProgress ? <FontAwesomeIcon icon={faSpinner} pulse /> : null} Adjust
                </Button>
            </AccordionActions>
        </Accordion>
        <Box my={1}>
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
                label='Hidden'
            />
        </Box>
        <ActionFab action={onSave}>
            <FontAwesomeIcon icon={faCheck}/>
        </ActionFab>
        <Button
            variant='contained'
            color='error'
            onClick={() => { setDelOpen(true) }}
            fullWidth
        >Delete</Button>
        <DeleteAccount name={acc.name} open={delOpen} setOpen={setDelOpen} />
    </Box>
}
