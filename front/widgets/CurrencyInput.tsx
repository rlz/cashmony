import { InputAdornment, TextField } from '@mui/material'
import React, { type ReactElement, useEffect, useState } from 'react'

import { getCurrencySymbol } from '../helpers/currencies.js'

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
    /^[0-9]*\.?[0-9]*$/
]

export function CurrencyInput(props: Props): ReactElement {
    const mult = props.mult ?? 1

    const [amountText, setAmountText] = useState('')

    const a = parseFloat(amountText)

    useEffect(() => {
        if (props.amount !== 0) {
            setAmountText((props.amount / mult).toFixed(2))
        }

        if (props.allowZero === true && amountText === '' && props.amount === 0) {
            setAmountText('0.00')
        }
    }, [])

    useEffect(() => {
        if (
            !Number.isNaN(a)
            && (
                (amountText !== '' && props.amount !== mult * a)
                || (amountText === '' && props.amount !== 0)
            )
        ) {
            setAmountText((props.amount / mult).toFixed(2))
        }
    }, [props.amount, mult, a, amountText])

    const error = (props.allowZero !== true && props.amount === 0)
        || (Number.isNaN(a) && amountText !== '')

    const helperText = (() => {
        if (props.allowZero !== true && amountText === '') {
            return 'Empty value not allowed'
        }

        if (props.allowZero !== true && props.amount === 0) {
            return 'Zero not allowed'
        }

        if (Number.isNaN(a) && amountText !== '') {
            return 'Not a number in #.## format'
        }

        return 'ok'
    })()

    return (
        <TextField
            autoFocus={props.autoFocus}
            fullWidth
            variant={'filled'}
            label={props.label}
            size={'small'}
            value={amountText}
            error={error}
            helperText={helperText}
            InputProps={{
                startAdornment: <InputAdornment position={'start'}>{getCurrencySymbol(props.currency)}</InputAdornment>
            }}
            onChange={(ev) => {
                const text = ev.target.value
                for (const re of regExps) {
                    if (re.test(text)) {
                        setAmountText(text)

                        if (text === '') {
                            props.onAmountChange(0)
                            break
                        }

                        const a = parseFloat(text)
                        if (!Number.isNaN(a)) {
                            props.onAmountChange(mult * a)
                            break
                        }
                    }
                }
            }}
        />
    )
}
