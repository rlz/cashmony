import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement, useEffect, useMemo } from 'react'
import { EditorScreen } from '../widgets/EditorScreen'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Button, FormControlLabel, Switch, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { CurrencyInput } from '../widgets/CurrencyInput'
import { type Operation, type Account } from '../model/model'
import { OperationsModel } from '../model/operations'
import { deepEqual } from '../helpers/deepEqual'
import { DateTime } from 'luxon'
import { formatCurrency } from '../helpers/currencies'
import { AccountsModel } from '../model/accounts'
import { AppState } from '../model/appState'
import { AccPlot } from '../widgets/AccountPlots'
import { v1 as uuid } from 'uuid'

const appState = AppState.instance()
const accountsModel = AccountsModel.instance()
const operationsModel = OperationsModel.instance()

export const AccountScreen = observer(() => {
    const accName = useParams().accName

    if (accName === undefined) {
        throw Error('accName expected here')
    }

    const [acc, setAcc] = useState<Account | null>(null)
    const [newAcc, setNewAcc] = useState<Account | null>(null)
    const [tab, setTab] = useState(0)
    const navigate = useNavigate()

    useEffect(() => {
        const account = accountsModel.get(accName)
        setAcc(account)
        setNewAcc(account)
    }, [accountsModel.accounts])

    const [perDayAmount, totalAmount] = useMemo(() => {
        const timeSpan = appState.timeSpan

        const allDates = [...timeSpan.allDates({ includeDayBefore: true })]

        const totalAmount = allDates.map((d) => accountsModel.getAmounts(d).get(accName) ?? 0)

        const perDayAmount = totalAmount.map((a, i, arr) => i === 0 ? 0 : a - arr[i - 1])

        return [perDayAmount, totalAmount]
    }, [accountsModel.amounts, appState.timeSpanInfo])

    if (acc === null || newAcc === null) {
        return <EmptyScreen />
    }

    const cur = (amount: number, compact = false): string => formatCurrency(amount, acc.currency, compact)

    let onSave: (() => Promise<void>) | null = null
    if (
        !deepEqual(acc, newAcc) &&
        newAcc.name.trim() !== '' &&
        (
            newAcc.name === acc.name ||
            !accountsModel.accounts.has(newAcc.name) ||
            accountsModel.get(newAcc.name).deleted === true
        )
    ) {
        onSave = async () => {
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
    }

    return <EditorScreen
        navigateOnBack='/accounts'
        title="Account"
        onSave={onSave}>
        <Typography variant='h6' textAlign="center" mt={2}>
            {newAcc.name.trim() === '' ? '-' : newAcc.name}
        </Typography>
        <Typography variant='h6' textAlign="center" color='primary.main' mb={1}>
            {cur(totalAmount[totalAmount.length - 1])}
        </Typography>
        <Tabs value={tab} onChange={(_, tab) => { setTab(tab) }} variant='fullWidth'>
            <Tab label="Stats"/>
            <Tab label="Modify"/>
        </Tabs>
        {
            tab === 0
                ? <Stats account={acc} perDayAmount={perDayAmount} totalAmount={totalAmount} />
                : <Editor acc={acc} newAcc={newAcc} setNewAcc={setNewAcc}/>
        }
    </EditorScreen>
})

function EmptyScreen (): ReactElement {
    return <EditorScreen navigateOnBack='/categories' title="Categories"/>
}

interface StatsProps {
    account: Account
    perDayAmount: number[]
    totalAmount: number[]
}

function Stats ({ account, perDayAmount, totalAmount }: StatsProps): ReactElement {
    return <Box display="flex" flexDirection="column" gap={1} mt={1} overflow="scroll">
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
    const [open, setOpen] = useState<'name' | 'goal' | null>(null)
    const amount = accountsModel.getAmounts(appState.today).get(acc.name) ?? 0
    const [adjustedAmount, setAdjustedAmount] = useState(amount)
    const [adjInProgress, setAdjInProgress] = useState(false)

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
                        accountsModel.accounts.has(newAcc.name) &&
                        accountsModel.get(newAcc.name).deleted !== true
                    }
                    label='Name'
                    size="small"
                    fullWidth
                    variant="filled"
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
                    negative={false}
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
            label="Hidden"
        />
    </Box>
}
