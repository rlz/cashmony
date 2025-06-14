import { Button, IconButton, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useState } from 'react'
import { uuidv7 } from 'uuidv7'

import { utcToday } from '../../../engine/dates'
import { sortCurrencies } from '../../../engine/sortCurrencies'
import { getCurrencySymbol } from '../../helpers/currencies'
import { screenWidthIs } from '../../helpers/useWidth'
import { useEngine } from '../../useEngine'
import { CurrencyInput } from '../../widgets/CurrencyInput'
import { CurrencySelector } from '../../widgets/CurrencySelector'
import { FullScreenModal } from '../../widgets/FullScreenModal'
import { Column, Row } from '../../widgets/generic/Containers'

export function AddAccount({ onClose }: { onClose: () => void }): ReactElement {
    const engine = useEngine()
    const [name, setName] = useState('')
    const [currency, setCurrency] = useState(sortCurrencies(engine)[0])
    const [initialAmount, setInitialAmount] = useState(0)
    const [curSelOpen, setCurSelOpen] = useState(false)
    const smallScreen = screenWidthIs('xs', 'sm')

    const save = () => {
        // reuse ids of deleted accounts
        const accId = engine.accounts.find(i => i.deleted === true)?.id ?? uuidv7()

        engine.pushAccount({
            id: accId,
            name: name.trim(),
            currency,
            hidden: false,
            lastModified: DateTime.utc()
        })
        if (initialAmount !== 0) {
            engine.pushOperation(
                {
                    id: uuidv7(),
                    lastModified: DateTime.utc(),
                    date: utcToday(),
                    type: 'adjustment',
                    currency,
                    amount: initialAmount,
                    account: {
                        id: accId,
                        amount: initialAmount
                    },
                    tags: [],
                    comment: 'Initial amount'
                }
            )
        }
        onClose()
    }

    const exists = engine.hasAccountWithName(name) && engine.getAccountByName(name).deleted !== true

    return (
        <FullScreenModal title={'Add account'} onClose={onClose}>
            <Column gap={1} p={1} minWidth={smallScreen ? undefined : '800px'}>
                <Row gap={1} alignItems={'flex-start'}>
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
                        onChange={(ev) => {
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
                    onAmountChange={(a) => { setInitialAmount(a) }}
                />
                <Button
                    fullWidth
                    variant={'contained'}
                    onClick={() => { void save() }}
                    disabled={name.trim() === '' || exists}
                >
                    {'Create'}
                </Button>
                {curSelOpen
                    ? (
                            <CurrencySelector
                                currency={currency}
                                onClose={() => { setCurSelOpen(false) }}
                                onCurrencySelected={(c) => {
                                    setCurrency(c)
                                    setCurSelOpen(false)
                                }}
                            />
                        )
                    : undefined}
            </Column>
        </FullScreenModal>
    )
}
