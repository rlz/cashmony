import { Box, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, TextField, Typography, useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useMemo, useState } from 'react'

import { CURRENCIES } from '../../currencies/currenciesList'
import { sortCurrencies } from '../../engine/sortCurrencies'
import { getCurrencySymbol } from '../helpers/currencies'
import { useEngine } from '../useEngine'
import { FullScreenModal } from './FullScreenModal'
import { Column } from './generic/Containers'

interface Props {
    currency: string | null
    onClose: () => void
    onCurrencySelected: (currency: string) => void
}

export const CurrencySelector = observer((props: Props): ReactElement => {
    const engine = useEngine()
    const theme = useTheme()
    const [search, setSearch] = useState('')
    const currency = props.currency !== null ? CURRENCIES[props.currency] : null

    const currencies = useMemo(
        () => sortCurrencies(engine).map(c => CURRENCIES[c]),
        [engine.operations]
    )

    return (
        <FullScreenModal width={'600px'} title={'Currency'} onClose={props.onClose}>
            <Column height={'100%'} p={1} gap={1}>
                <Box p={1} color={theme.palette.primary.main}>
                    <Typography variant={'h5'} my={2} textAlign={'center'}>
                        {
                            currency === null
                                ? '—'
                                : `${currency.name}, ${getCurrencySymbol(currency.code)}, ${currency.code}`
                        }
                    </Typography>
                </Box>
                <TextField
                    variant={'filled'}
                    size={'small'}
                    label={'Search'}
                    value={search}
                    onChange={(ev) => {
                        setSearch(ev.target.value)
                    }}
                />
                <Box overflow={'auto'} flex={'1 1 auto'}>
                    <List>
                        {
                            currencies
                                .filter((c) => {
                                    const s = search.trim().toLocaleLowerCase()

                                    if (s === '') return true

                                    return c.name.toLocaleLowerCase().includes(s)
                                        || c.code.toLocaleLowerCase().includes(s)
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
                                        i + 1 < arr.length ? <Divider key={c.code + 'd'} /> : null
                                    ]
                                })
                        }
                    </List>
                </Box>
            </Column>
        </FullScreenModal>
    )
})
