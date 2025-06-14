import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { match } from 'ts-pattern'

import { type NotDeletedOperation } from '../../../../engine/model'
import { formatExchangeRate } from '../../../helpers/currencies'
import { useEngine } from '../../../useEngine'
import { CurrencyInput } from '../../CurrencyInput'
import { AccountsSelect } from '../../select/AccountsSelect'

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

export const AccountEditor = observer((props: Props): ReactElement => {
    const engine = useEngine()

    const account = props.account !== null ? engine.getAccount(props.account.id) : null

    return (
        <Accordion
            disableGutters
            expanded={props.expanded}
            onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
        >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                <Typography>{props.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <AccountsSelect
                    selected={match(props.account).with(null, () => []).otherwise(v => [v.id])}
                    onSelectedChange={(selected) => {
                        props.onAccountChange({
                            id: selected[0],
                            amount: props.account?.amount ?? 0
                        })
                    }}
                    selectMany={false}
                    selectZero={false}
                    showHidden={false}
                />
                {props.account === null || account === null || account === undefined || props.opCurrency === account.currency
                    ? null
                    : (
                            <Box mt={1}>
                                <CurrencyInput
                                    mult={props.negative ? -1 : 1}
                                    label={`Amount — ${formatExchangeRate(Math.abs(props.opAmount), Math.abs(props.account.amount))}`}
                                    amount={props.account.amount}
                                    currency={account.currency}
                                    onAmountChange={(accountAmount) => {
                                        if (props.account === null) {
                                            throw Error('Not null props.account expected here')
                                        }

                                        props.onAccountChange({
                                            id: props.account.id,
                                            amount: accountAmount
                                        })
                                    }}
                                />
                            </Box>
                        )}
            </AccordionDetails>
        </Accordion>
    )
})
