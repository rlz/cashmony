import React, { useState, type ReactElement } from 'react'
import { FullScreenModal } from './FullScreenModal'
import { CategoriesModel } from '../model/categories'
import { Box, Button, IconButton, TextField } from '@mui/material'
import { CurrenciesModel } from '../model/currencies'
import { DateTime } from 'luxon'
import { getCurrencySymbol } from '../helpers/currencies'
import { CurrencySelector } from './CurrencySelector'

const currenciesModel = CurrenciesModel.instance()
const categoriesModel = CategoriesModel.instance()

export function AddCategory ({ onClose }: { onClose: () => void }): ReactElement {
    const [name, setName] = useState('')
    const [currency, setCurrency] = useState(currenciesModel.currencies[0])
    const [curSelOpen, setCurSelOpen] = useState(false)

    const save = async (): Promise<void> => {
        await categoriesModel.put({
            name,
            currency,
            hidden: false,
            lastModified: DateTime.utc()
        })
        onClose()
    }

    return <FullScreenModal title="Add category" onClose={onClose} gap={1}>
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
        <Button
            fullWidth
            variant="contained"
            onClick={() => { void save() }}
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
