import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Typography } from '@mui/material'
import React, { type ReactElement } from 'react'
import { type NotDeletedOperation } from '../model/model'
import { AccountsModel } from '../model/accounts'
import { observer } from 'mobx-react-lite'
import { formatCurrency, formatExchangeRate } from '../helpers/currencies'
import { CurrencyInput } from './CurrencyInput'

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
    const account = accountsModel.accounts[props.account.name]

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
                        account.currency
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
            {props.opCurrency === account.currency
                ? null
                : <Box mt={1}>
                    <CurrencyInput
                        negative={props.opAmount < 0}
                        label={`Amount — ${formatExchangeRate(props.opAmount, props.account.amount)}`}
                        amount={props.account.amount}
                        currency={account.currency}
                        onAmountChange={(accountAmount) => {
                            props.onAccountChange({
                                name: props.account.name,
                                amount: accountAmount
                            })
                        }}
                    />
                </Box>
            }
        </AccordionDetails>
    </Accordion>
})
