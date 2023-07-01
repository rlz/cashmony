import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Box, IconButton, Typography } from '@mui/material'
import React, { useState, type ReactElement } from 'react'
import { observer } from 'mobx-react-lite'
import { getCurrencySymbol } from '../../../helpers/currencies'
import { CurrencyInput } from '../../CurrencyInput'
import { CurrencySelector } from '../../CurrencySelector'
import { showIf } from '../../../helpers/smallTools'

interface Props {
    amount: number
    negative: boolean
    currency: string
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    onCurrencyChange: (currency: string) => void
    onAmountChange: (amount: number) => void
}

export const AmountEditor = observer((props: Props): ReactElement => {
    const [curSelOpen, setCurSelOpen] = useState(false)

    return <>
        <Accordion
            disableGutters
            expanded={props.expanded}
            onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
        >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
                <Typography>Amount</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {
                    showIf(
                        props.expanded,
                        <Box display="flex" gap={1}>
                            <IconButton
                                color='primary'
                                sx={{ width: 48 }}
                                onClick={() => { setCurSelOpen(true) }}
                            >
                                {getCurrencySymbol(props.currency)}
                            </IconButton>
                            <CurrencyInput
                                autoFocus
                                label='Amount'
                                mult={props.negative ? -1 : 1}
                                amount={props.amount}
                                currency={props.currency}
                                onAmountChange={props.onAmountChange}
                            />
                        </Box>

                    )
                }
            </AccordionDetails>
        </Accordion>
        { curSelOpen
            ? <CurrencySelector
                currency={props.currency}
                onClose={() => { setCurSelOpen(false) }}
                onCurrencySelected={props.onCurrencyChange}
            />
            : null
        }
    </>
})
