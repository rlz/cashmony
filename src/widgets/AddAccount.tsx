import React, { useState, type ReactElement } from 'react'
import { FullScreenModal } from './FullScreenModal'
import { Box, Button, IconButton, TextField, Typography } from '@mui/material'
import { CurrenciesModel } from '../model/currencies'
import { DateTime } from 'luxon'
import { getCurrencySymbol } from '../helpers/currencies'
import { CurrencySelector } from './CurrencySelector'
import { AccountsModel } from '../model/accounts'
import { CurrencyInput } from './CurrencyInput'
import { OperationsModel } from '../model/operations'
import { v1 as uuid } from 'uuid'
import { utcToday } from '../helpers/dates'

const currenciesModel = CurrenciesModel.instance()
const accountsModel = AccountsModel.instance()
const operationsModel = OperationsModel.instance()

export function AddAccount ({ onClose }: { onClose: () => void }): ReactElement {
    const [name, setName] = useState('')
    const [currency, setCurrency] = useState(currenciesModel.currencies[0])
    const [initialAmount, setInitialAmount] = useState(0)
    const [curSelOpen, setCurSelOpen] = useState(false)

    const save = async (): Promise<void> => {
        await accountsModel.put({
            name: name.trim(),
            currency,
            hidden: false,
            lastModified: DateTime.utc()
        })
        if (initialAmount !== 0) {
            await operationsModel.put([
                {
                    id: uuid(),
                    lastModified: DateTime.utc(),
                    date: utcToday(),
                    type: 'adjustment',
                    currency,
                    amount: initialAmount,
                    account: {
                        name: name.trim(),
                        amount: initialAmount
                    },
                    tags: [],
                    comment: 'Initial amount'
                }
            ])
        }
        onClose()
    }

    return <FullScreenModal title="Add account" onClose={onClose} gap={1}>
        <Box display="flex" gap={1}>
            <IconButton
                color='primary'
                sx={{ width: 48 }}
                onClick={() => { setCurSelOpen(true) }}
            >
                {getCurrencySymbol(currency)}
            </IconButton>
            <TextField
                label="Name"
                variant="filled"
                size="small"
                value={name}
                onChange={ev => {
                    setName(ev.target.value)
                }}
                sx={{ flex: '1 0 0' }}
            />
        </Box>
        <CurrencyInput
            allowZero
            negative={false}
            label='Initial amount'
            currency={currency}
            amount={initialAmount}
            onAmountChange={a => { setInitialAmount(a) }}
        />
        <Button
            fullWidth
            variant="contained"
            onClick={() => { void save() }}
            disabled={name.trim() === '' || accountsModel.accounts.has(name.trim())}
        >Create</Button>
        {curSelOpen
            ? <CurrencySelector
                currency={currency}
                onClose={() => { setCurSelOpen(false) }}
                onCurrencySelected={c => {
                    setCurrency(c)
                    setCurSelOpen(false)
                }}
            />
            : undefined}
        <Typography variant='body2' fontStyle='italic' color="error.main">
            {name.trim() === '' ? 'Input account name' : null}
            {accountsModel.accounts.has(name.trim()) ? 'Already exists' : null}
        </Typography>
    </FullScreenModal>
}
