import { faCloudArrowUp, faFilter } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, ToggleButtonGroup, ToggleButton } from '@mui/material'
import React, { useState, type ReactElement } from 'react'
import { observer } from 'mobx-react-lite'
import { PeriodSelector } from '../PeriodSelector'
import { AppState } from '../../model/appState'
import { runInAction } from 'mobx'
import { showIf } from '../../helpers/smallTools'
import { CurrencySelector } from '../CurrencySelector'
import { getCurrencySymbol } from '../../helpers/currencies'
import { FilterEditor } from '../FilterEditor'
import { initGoogleSync } from '../../model/sync'
import { Column } from '../Containers'

const appState = AppState.instance()

type Props = Omit<React.ComponentProps<typeof Column>, 'gap'>

export const AppStateSettings = observer((props: Props): ReactElement => {
    const [showCurSelector, setShowCurSelector] = useState(false)
    const [showFilterEditor, setShowFilterEditor] = useState(false)

    return <Column gap={1} {...props}>
        {
            showIf(
                showCurSelector,
                <CurrencySelector
                    currency={appState.masterCurrency}
                    onClose={() => { setShowCurSelector(false) }}
                    onCurrencySelected={c => { runInAction(() => { appState.masterCurrency = c }) }}
                />
            )
        }
        {
            showIf(
                showFilterEditor,
                <FilterEditor
                    filter={appState.filter}
                    onClose={() => { setShowFilterEditor(false) }}
                    onFilterChanged={filter => {
                        runInAction(() => {
                            appState.filter = filter
                        })
                    }}
                />
            )
        }
        <Box flex='1 1 0' mt={1} px={1}>
            <PeriodSelector/>
        </Box>
        <Box px={1} display='flex' gap={1} justifyContent='space-between' alignItems='center'>
            <div>Theme:</div>
            <ToggleButtonGroup
                size='small'
                color='primary'
                value={appState.theme}
                exclusive
                onChange={(_, value: 'light' | 'dark' | 'auto' | null) => {
                    if (value !== null) {
                        runInAction(() => {
                            appState.theme = value
                        })
                    }
                }}
            >
                <ToggleButton value='light'>Light</ToggleButton>
                <ToggleButton value='dark'>Dark</ToggleButton>
                <ToggleButton value='auto'>Auto</ToggleButton>
            </ToggleButtonGroup>
        </Box>
        <List>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { setShowFilterEditor(true) }}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faFilter} />
                    </ListItemIcon>
                    <ListItemText primary='Filter operations' />
                </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { setShowCurSelector(true) }}>
                    <ListItemIcon>
                        {getCurrencySymbol(appState.masterCurrency)}
                    </ListItemIcon>
                    <ListItemText primary='Master currency' />
                </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { void initGoogleSync() }}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faCloudArrowUp} />
                    </ListItemIcon>
                    <ListItemText primary='Sync with Google' />
                </ListItemButton>
            </ListItem>
        </List>
    </Column>
})
