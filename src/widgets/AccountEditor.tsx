import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Typography } from '@mui/material'
import React, { type ReactElement } from 'react'
import { type NotDeletedOperation } from '../model/model'
import { AccountsModel } from '../model/accounts'
import { observer } from 'mobx-react-lite'
import { formatExchangeRate } from '../helpers/currencies'
import { CurrencyInput } from './CurrencyInput'

interface Props {
    title: string
    opAmount: number
    negative: boolean
    opCurrency: string
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    account: NotDeletedOperation['account'] | null
    onAccountChange: (account: NotDeletedOperation['account']) => void
    hideAccount?: string
}

const accountsModel = AccountsModel.instance()

export const AccountEditor = observer((props: Props): ReactElement => {
    const account = props.account !== null ? accountsModel.get(props.account.name) : null

    return <Accordion
        disableGutters
        expanded={props.expanded}
        onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
    >
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
            <Typography>{props.title}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={1} maxHeight="128px" overflow="scroll">
                { accountsModel.accountsSorted.map(a => {
                    const acc = accountsModel.get(a)

                    if (acc.hidden || acc.deleted === true || acc.name === props.hideAccount) {
                        return undefined
                    }

                    if (a === props.account?.name) {
                        return <a key={a} >
                            <Chip color="primary" size='small' label={a}/>
                        </a>
                    }
                    return <a
                        key={a}
                        onClick={() => {
                            props.onAccountChange({
                                name: a,
                                amount: props.account?.amount ?? 0
                            })
                        }}
                    >
                        <Chip size='small' label={a}/>
                    </a>
                })}
            </Box>
            {props.account === null || account === null || account === undefined || props.opCurrency === account.currency
                ? null
                : <Box mt={1}>
                    <CurrencyInput
                        negative={props.negative}
                        label={`Amount — ${formatExchangeRate(Math.abs(props.opAmount), Math.abs(props.account.amount))}`}
                        amount={props.account.amount}
                        currency={account.currency}
                        onAmountChange={(accountAmount) => {
                            if (props.account === null) {
                                throw Error('Not null props.account expected here')
                            }

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
