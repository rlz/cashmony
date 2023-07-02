import React, { useState, type ReactElement } from 'react'
import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Typography, useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { CURRENCIES } from '../helpers/currenciesList'
import { getCurrencySymbol } from '../helpers/currencies'
import { FullScreenModal } from './FullScreenModal'
import { CurrenciesModel } from '../model/currencies'
import { Column } from './Containers'

const currenciesModel = CurrenciesModel.instance()

interface Props {
    currency: string | null
    onClose: () => void
    onCurrencySelected: (currency: string) => void
}

export const CurrencySelector = observer((props: Props): ReactElement => {
    const theme = useTheme()
    const [search, setSearch] = useState('')
    const currency = props.currency !== null ? CURRENCIES[props.currency] : null

    return <FullScreenModal title='Currency' onClose={props.onClose}>
        <Column height='100%' p={1} gap={1}>
            <Box p={1} color={theme.palette.primary.main}>
                <Typography variant='h5' my={2} textAlign='center'>
                    {
                        currency === null
                            ? '—'
                            : `${currency.name}, ${getCurrencySymbol(currency.code)}, ${currency.code}`
                    }
                </Typography>
            </Box>
            <TextField variant='filled' size='small' label='Search' value={search} onChange={ev => {
                setSearch(ev.target.value)
            }} />
            <Box overflow='scroll' flex='1 1 700'>
                <List>
                    {currenciesModel.currencies
                        .map(c => CURRENCIES[c])
                        .filter(c => {
                            const s = search.trim().toLocaleLowerCase()

                            if (s === '') return true

                            return c.name.toLocaleLowerCase().includes(s) ||
                            c.code.toLocaleLowerCase().includes(s)
                        })
                        .map((c, i, arr) => {
                            return [
                                <ListItemButton
                                    key={c.code}
                                    onClick={() => {
                                        props.onCurrencySelected(c.code)
                                        props.onClose()
                                    }}
                                >
                                    <ListItem disablePadding>
                                        <ListItemIcon>
                                            {getCurrencySymbol(c.code)}
                                        </ListItemIcon>
                                        <ListItemText primary={c.name} secondary={c.code} />
                                    </ListItem>
                                </ListItemButton>,
                                i + 1 < arr.length ? <Divider key={c.code + 'd'}/> : null
                            ]
                        })}
                </List>
            </Box>
        </Column>
    </FullScreenModal>
})
