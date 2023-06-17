import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, SwipeableDrawer, type SwipeableDrawerProps, Box, ToggleButtonGroup, ToggleButton } from '@mui/material'
import React, { useState, type ReactElement } from 'react'
import { observer } from 'mobx-react-lite'
import { initGoogleSync } from '../model/sync'
import { PeriodSelector } from './PeriodSelector'
import { AppState } from '../model/appState'
import { runInAction } from 'mobx'
import { showIf } from '../helpers/smallTools'
import { CurrencySelector } from './CurrencySelector'
import { getCurrencySymbol } from '../helpers/currencies'

const appState = AppState.instance()

export const MainAppDrawer = observer((props: SwipeableDrawerProps): ReactElement => {
    const [showCurSelector, setShowCurSelector] = useState(false)

    return <SwipeableDrawer
        open={props.open}
        anchor='left'
        onOpen={props.onOpen}
        onClose={props.onClose}
    >
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
        <Box display="flex" flexDirection="column" gap={1} height="100%" width="90vw" maxWidth="20rem">
            <Box flex="1 1 0" mt={1} px={1}>
                <PeriodSelector/>
            </Box>
            <Box px={1} display="flex" gap={1} justifyContent='space-between' alignItems="center">
                <div>Theme:</div>
                <ToggleButtonGroup
                    size='small'
                    color="primary"
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
                    <ToggleButton value="light">Light</ToggleButton>
                    <ToggleButton value="dark">Dark</ToggleButton>
                    <ToggleButton value="auto">Auto</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => { setShowCurSelector(true) }}>
                        <ListItemIcon>
                            {getCurrencySymbol(appState.masterCurrency)}
                        </ListItemIcon>
                        <ListItemText primary="Master currency" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => { void initGoogleSync() }}>
                        <ListItemIcon>
                            <FontAwesomeIcon icon={faCloudArrowUp} />
                        </ListItemIcon>
                        <ListItemText primary="Sync with Google" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    </SwipeableDrawer>
})
