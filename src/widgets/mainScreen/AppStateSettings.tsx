import { faCloudArrowUp, faFilter } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'

import { getCurrencySymbol } from '../../helpers/currencies'
import { CURRENCIES } from '../../helpers/currenciesList'
import { run, showIf } from '../../helpers/smallTools'
import { AppState } from '../../model/appState'
import { initGoogleSync } from '../../model/sync'
import { CurrencySelector } from '../CurrencySelector'
import { FilterEditor } from '../FilterEditor'
import { Column } from '../generic/Containers'
import { DivBody1 } from '../generic/Typography'
import { PeriodSelector } from '../PeriodSelector'

const appState = AppState.instance()

type Props = Omit<React.ComponentProps<typeof Column>, 'gap'>

export const AppStateSettings = observer((props: Props): ReactElement => {
    return <Column gap={1} {...props}>
        {
            showIf(
                appState.topBarState.showGlobalCurrencySelector,
                <CurrencySelector
                    currency={appState.masterCurrency}
                    onClose={() => { runInAction(() => { appState.topBarState.showGlobalCurrencySelector = false }) }}
                    onCurrencySelected={c => { runInAction(() => { appState.masterCurrency = c }) }}
                />
            )
        }
        {
            showIf(
                appState.topBarState.showGlobalFilterEditor,
                <FilterEditor
                    filter={appState.filter}
                    onClose={() => { runInAction(() => { appState.topBarState.showGlobalFilterEditor = false }) }}
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
                <ListItemButton onClick={() => { runInAction(() => { appState.topBarState.showGlobalFilterEditor = true }) }}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faFilter} fixedWidth/>
                    </ListItemIcon>
                    <ListItemText primary='Filter operations' />
                </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { runInAction(() => { appState.topBarState.showGlobalCurrencySelector = true }) }}>
                    <ListItemIcon>
                        {
                            run(() => {
                                const icon = CURRENCIES[appState.masterCurrency].faIcon
                                return icon !== undefined
                                    ? <FontAwesomeIcon icon={icon} fixedWidth/>
                                    : <DivBody1 width={20} textAlign='center' fontWeight='bold'>
                                        {getCurrencySymbol(appState.masterCurrency)}
                                    </DivBody1>
                            })
                        }
                    </ListItemIcon>
                    <ListItemText primary='Master currency' />
                </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { void initGoogleSync() }}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faCloudArrowUp} fixedWidth/>
                    </ListItemIcon>
                    <ListItemText primary='Sync with Google' />
                </ListItemButton>
            </ListItem>
        </List>
    </Column>
})
