import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Box, IconButton, Typography } from '@mui/material'
import React, { useState, type ReactElement } from 'react'
import { observer } from 'mobx-react-lite'
import { formatCurrency, getCurrencySymbol } from '../helpers/currencies'
import { CurrencyInput } from './CurrencyInput'
import { CurrencySelector } from './CurrencySelector'

interface Props {
    amount: number
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
                <Typography component='div' noWrap flex='1 0 0' width={0}>
                    {'Amount: '}
                    {props.amount === 0
                        ? '_.__'
                        : formatCurrency(
                            Math.abs(props.amount),
                            props.currency
                        )
                    }
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box display="flex" gap={1}>
                    <IconButton
                        color='primary'
                        sx={{ width: 48 }}
                        onClick={() => { setCurSelOpen(true) }}
                    >
                        {getCurrencySymbol(props.currency)}
                    </IconButton>
                    <CurrencyInput
                        label='Amount'
                        negative={props.amount < 0}
                        amount={props.amount}
                        currency={props.currency}
                        onAmountChange={props.onAmountChange}
                    />
                </Box>
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
