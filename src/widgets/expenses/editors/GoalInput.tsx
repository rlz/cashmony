import React, { useState, type ReactElement } from 'react'
import { Column, Row } from '../../Containers'
import { IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { CurrencyInput } from '../../CurrencyInput'
import { getCurrencySymbol } from '../../../helpers/currencies'
import { showIf } from '../../../helpers/smallTools'
import { CurrencySelector } from '../../CurrencySelector'
import { DivBody1 } from '../../Typography'

interface Props {
    currency: string
    onCurrencyChange: (currency: string) => void
    perDayAmount: number
    onPerDayAmountChange: (amount: number) => void
}

type PeriodType = 'day' | 'month' | 'year'

const MULT = {
    day: 1,
    month: 12 / 365,
    year: 1 / 365
}

export function GoalInput (props: Props): ReactElement {
    const [period, setPeriod] = useState<PeriodType>('month')
    const [currencySelector, setCurrecySelector] = useState(false)

    return <>
        <Column gap={1}>
            <Row alignItems='center' gap={1}>
                <DivBody1 flex="1 1 0">Set goal</DivBody1>
                <ToggleButtonGroup
                    size='small'
                    exclusive
                    value={period}
                    onChange={(_, p) => {
                        if (p === null || p === period) {
                            return
                        }

                        setPeriod(p)
                    }}
                >
                    <ToggleButton value="day">Day</ToggleButton>
                    <ToggleButton value="month">Month</ToggleButton>
                    <ToggleButton value="year">Year</ToggleButton>
                </ToggleButtonGroup>
            </Row>
            <Row gap={1}>
                <IconButton
                    color='primary'
                    sx={{ width: 48 }}
                    onClick={() => { setCurrecySelector(true) }}
                >
                    {getCurrencySymbol(props.currency)}
                </IconButton>
                <CurrencyInput
                    label='Per day amount'
                    mult={MULT[period]}
                    amount={props.perDayAmount}
                    currency={props.currency}
                    onAmountChange={a => { props.onPerDayAmountChange(a) }}
                />
            </Row>
        </Column>
        {
            showIf(currencySelector, <CurrencySelector
                currency={props.currency}
                onClose={() => { setCurrecySelector(false) }}
                onCurrencySelected={props.onCurrencyChange}
            />)
        }
    </>
}
