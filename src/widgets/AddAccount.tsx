import React, { useState, type ReactElement } from 'react'
import { FullScreenModal } from './FullScreenModal'
import { Box, Button, IconButton, TextField } from '@mui/material'
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

    const acc = accountsModel.accounts?.get(name)
    const exists = acc !== undefined && acc.deleted !== true

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
                error={name.trim() === '' || exists}
                helperText={
                    name.trim() === ''
                        ? 'Empty'
                        : (exists ? 'Already exists' : undefined)
                }
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
            disabled={name.trim() === '' || exists}
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
    </FullScreenModal>
}
