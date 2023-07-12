import { InputAdornment, TextField } from '@mui/material'
import React, { type ReactElement, useEffect, useState } from 'react'

import { getCurrencySymbol } from '../helpers/currencies'

interface Props {
    autoFocus?: boolean
    allowZero?: boolean
    mult?: number
    label: string
    amount: number
    currency: string
    onAmountChange: (amount: number) => void
}

const regExps = [
    /^[0-9]*$/,
    /^[0-9]+\.$/,
    /^[0-9]+\.[0-9]+$/
]

export function CurrencyInput (props: Props): ReactElement {
    const [amountText, setAmountText] = useState('')

    const mult = props.mult ?? 1
    const a = parseFloat(amountText)

    useEffect(() => {
        if (props.allowZero === true && amountText === '' && props.amount === 0) {
            setAmountText('0.00')
        }
    }, [])

    useEffect(() => {
        if (
            (amountText !== '' && props.amount !== mult * a) ||
            (amountText === '' && props.amount !== 0)
        ) {
            setAmountText((props.amount / mult).toFixed(2))
        }
    }, [props.amount, mult, a, amountText])

    const error = props.allowZero !== true && (Number.isNaN(a) || a === 0)

    return <TextField
        autoFocus={props.autoFocus}
        fullWidth
        variant={'filled'}
        label={props.label}
        size={'small'}
        value={amountText}
        error={error}
        InputProps={{
            startAdornment: <InputAdornment position={'start'}>{getCurrencySymbol(props.currency)}</InputAdornment>
        }}
        onChange={(ev) => {
            const text = ev.target.value
            for (const re of regExps) {
                if (re.test(text)) {
                    const amountText = ev.target.value
                    setAmountText(amountText)

                    if (amountText === '') {
                        props.onAmountChange(0)
                        break
                    }

                    const a = parseFloat(amountText)
                    if (!Number.isNaN(a)) {
                        props.onAmountChange(mult * a)
                        break
                    }
                }
            }
        }}
    />
}
