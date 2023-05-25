import { InputAdornment, TextField } from '@mui/material'
import React, { useState, type ReactElement, useEffect } from 'react'
import { getCurrencySymbol } from '../helpers/currencies'

interface Props {
    negative: boolean
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
    const [amountText, setAmountText] = useState(Math.abs(props.amount).toFixed(2))

    const mult = props.negative ? -1 : 1
    const a = parseFloat(amountText)

    useEffect(() => {
        if (amountText !== '' && props.amount !== mult * a) {
            setAmountText(Math.abs(props.amount).toFixed(2))
        }
    }, [props.amount, mult, a, amountText])

    const error = Number.isNaN(a) || a === 0

    return <TextField
        fullWidth
        variant='filled'
        label={props.label}
        size='small'
        value={amountText}
        error={error}
        InputProps={{
            startAdornment: <InputAdornment position="start">{getCurrencySymbol(props.currency)}</InputAdornment>
        }}
        onChange={(ev) => {
            const text = ev.target.value
            for (const re of regExps) {
                if (re.test(text)) {
                    setAmountText(ev.target.value)

                    const a = parseFloat(ev.target.value)
                    if (!Number.isNaN(a)) {
                        props.onAmountChange(mult * a)
                        break
                    }
                }
            }
        }}
    />
}
