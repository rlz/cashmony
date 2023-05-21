import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, InputAdornment, TextField, Typography } from '@mui/material'
import React, { useState, type ReactElement } from 'react'
import { type Account, type NotDeletedOperation } from '../model/model'
import { AccountsModel } from '../model/accounts'
import { observer } from 'mobx-react-lite'
import { formatCurrency, getCurrencySymbol } from '../helpers/currencies'

interface Props {
    opAmount: number
    opCurrency: string
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    account: NotDeletedOperation['account']
    onAccountChange: (account: NotDeletedOperation['account']) => void
}

const accountsModel = AccountsModel.instance()

export const AccountEditor = observer((props: Props): ReactElement => {
    return <Accordion
        disableGutters
        expanded={props.expanded}
        onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
    >
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
            <Typography component='div' noWrap flex='1 0 0' width={0}>
                Account: {props.account.name}
                {' — '}
                {props.account.amount === 0
                    ? '_.__'
                    : formatCurrency(
                        Math.abs(props.account.amount),
                        accountsModel.accounts[props.account.name].currency
                    )
                }
            </Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={1} maxHeight="128px" overflow="scroll">
                { Object.values(accountsModel.accounts).map(a => {
                    if (a.name === props.account.name) {
                        return <a key={a.name} >
                            <Chip color="primary" size='small' label={a.name}/>
                        </a>
                    }
                    return <a
                        key={a.name}
                        onClick={() => {
                            props.onAccountChange({
                                name: a.name,
                                amount: props.account.amount
                            })
                        }}
                    >
                        <Chip size='small' label={a.name}/>
                    </a>
                })}
            </Box>
            <AccountAmountEditor
                opAmount={props.opAmount}
                opCurrency={props.opCurrency}
                account={accountsModel.accounts[props.account.name]}
                accountAmount={props.account.amount}
                onAccountAmountChange={(accountAmount) => {
                    props.onAccountChange({
                        name: props.account.name,
                        amount: accountAmount
                    })
                }}
            />
        </AccordionDetails>
    </Accordion>
})

interface Props2 {
    opAmount: number
    opCurrency: string
    account: Account
    accountAmount: number
    onAccountAmountChange: (accountAmount: number) => void
}

const amountInpRes = [
    /^[0-9]*$/,
    /^[0-9]+\.$/,
    /^[0-9]+\.[0-9]+$/
]

function AccountAmountEditor (props: Props2): ReactElement | null {
    const mult = props.opAmount < 0 ? -1 : 1

    if (props.opCurrency === props.account.currency) {
        return null
    }

    const [amountText, setAmountText] = useState(Math.abs(props.accountAmount).toFixed(2))

    const a = parseFloat(amountText)

    const error = Number.isNaN(a) || a === 0

    return <Box mt={1}>
        <TextField
            fullWidth
            variant='filled'
            label={`Amount — ${formatExchangeRate(props.opAmount, props.accountAmount)}`}
            size='small'
            value={amountText}
            error={error}
            InputProps={{
                startAdornment: <InputAdornment position="start">{getCurrencySymbol(props.account.currency)}</InputAdornment>
            }}
            onChange={(ev) => {
                const text = ev.target.value
                for (const re of amountInpRes) {
                    if (re.test(text)) {
                        setAmountText(ev.target.value)

                        const a = parseFloat(ev.target.value)
                        if (!Number.isNaN(a) && a !== 0) {
                            props.onAccountAmountChange(mult * a)
                            break
                        }
                    }
                }
            }}
        />
    </Box>
}

function formatExchangeRate (from: number, to: number): string {
    if (from === 0 || to === 0) {
        return 'Exc. rate: _.__'
    }

    const r = (Math.max(from / to, to / from)).toFixed(2)

    return `Exc. rate: ${r}`
}
