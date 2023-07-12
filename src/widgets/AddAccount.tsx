import { Button, IconButton, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useState } from 'react'
import { v1 as uuid } from 'uuid'

import { getCurrencySymbol } from '../helpers/currencies'
import { utcToday } from '../helpers/dates'
import { AccountsModel } from '../model/accounts'
import { CurrenciesModel } from '../model/currencies'
import { OperationsModel } from '../model/operations'
import { CurrencyInput } from './CurrencyInput'
import { CurrencySelector } from './CurrencySelector'
import { FullScreenModal } from './FullScreenModal'
import { Column, Row } from './generic/Containers'

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

    return <FullScreenModal title={'Add account'} onClose={onClose}>
        <Column gap={1} p={1}>
            <Row gap={1}>
                <IconButton
                    color={'primary'}
                    sx={{ width: 48 }}
                    onClick={() => { setCurSelOpen(true) }}
                >
                    {getCurrencySymbol(currency)}
                </IconButton>
                <TextField
                    label={'Name'}
                    variant={'filled'}
                    size={'small'}
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
            </Row>
            <CurrencyInput
                allowZero
                label={'Initial amount'}
                currency={currency}
                amount={initialAmount}
                onAmountChange={a => { setInitialAmount(a) }}
            />
            <Button
                fullWidth
                variant={'contained'}
                onClick={() => { void save() }}
                disabled={name.trim() === '' || exists}
            >{'Create'}</Button>
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
        </Column>
    </FullScreenModal>
}
