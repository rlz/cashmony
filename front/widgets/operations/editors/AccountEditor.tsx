import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { match } from 'ts-pattern'

import { type NotDeletedOperation } from '../../../../engine/model.js'
import { formatExchangeRate } from '../../../helpers/currencies.js'
import { useEngine } from '../../../useEngine.js'
import { CurrencyInput } from '../../CurrencyInput.js'
import { AccountsSelect } from '../../select/AccountsSelect.js'

interface Props {
    title: string
    opAmount: number
    negative: boolean
    opCurrency: string
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    account: NotDeletedOperation['account'] | null
    onAccountChange: (account: NotDeletedOperation['account'] | null) => void
    alreadySelected?: string
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
                        if (selected.length > 0) {
                            props.onAccountChange({
                                id: selected[0],
                                amount: props.account?.amount ?? 0
                            })
                        } else {
                            props.onAccountChange(null)
                        }
                    }}
                    alreadySelected={props.alreadySelected}
                    selectMany={false}
                    selectZero={props.alreadySelected !== undefined}
                    showHidden={false}
                />
                {
                    props.account === null || account === null || account === undefined || props.opCurrency === account.currency
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
                            )
                }
            </AccordionDetails>
        </Accordion>
    )
})
