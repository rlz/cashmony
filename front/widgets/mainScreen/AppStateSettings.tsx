import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CloudSync, Dangerous, FilterAlt, GitHub, Logout, Telegram } from '@mui/icons-material'
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { useAuthState } from 'rlz-engine/dist/client/state/auth'

import { CURRENCIES } from '../../../currencies/currenciesList'
import { getCurrencySymbol } from '../../helpers/currencies'
import { run, showIf } from '../../helpers/smallTools'
import { apiSync } from '../../model/apiSync'
import { useFrontState } from '../../model/FrontState'
import { useEngine } from '../../useEngine'
import { CurrencySelector } from '../CurrencySelector'
import { FilterEditor } from '../FilterEditor'
import { Column } from '../generic/Containers'
import { DivBody1 } from '../generic/Typography'
import { PeriodSelector } from '../PeriodSelector'

type Props = Omit<React.ComponentProps<typeof Column>, 'gap'> & {
    onOpenAdvance: () => void
}

export const AppStateSettings = observer(({ onOpenAdvance, ...columnProps }: Props): ReactElement => {
    const appState = useFrontState()
    const authState = useAuthState()
    const engine = useEngine()

    const [lastSyncText, setLastSyncText] = useState(
        appState.lastSyncDate === null
            ? 'never'
            : appState.lastSyncDate
                .diffNow()
                .negate()
                .shiftTo('hours', 'minutes', 'seconds')
                .set({ seconds: 0 })
                .shiftTo('hours', 'minutes')
                .toHuman({ unitDisplay: 'short' })
    )

    useEffect(() => {
        const i = setInterval(() => {
            setLastSyncText(
                appState.lastSyncDate === null
                    ? 'never'
                    : appState.lastSyncDate
                        .diffNow()
                        .negate()
                        .shiftTo('hours', 'minutes', 'seconds')
                        .set({ seconds: 0 })
                        .shiftTo('hours', 'minutes')
                        .toHuman({ unitDisplay: 'short' })
            )
        }, 10000)
        return () => clearInterval(i)
    }, [])

    return (
        <Column gap={1} {...columnProps}>
            {
                showIf(
                    appState.topBarState.showGlobalCurrencySelector,
                    <CurrencySelector
                        currency={appState.masterCurrency}
                        onClose={() => { runInAction(() => { appState.topBarState.showGlobalCurrencySelector = false }) }}
                        onCurrencySelected={(c) => { runInAction(() => { appState.masterCurrency = c }) }}
                    />
                )
            }
            {
                showIf(
                    appState.topBarState.showGlobalFilterEditor,
                    <FilterEditor
                        filter={appState.filter}
                        onClose={() => { runInAction(() => { appState.topBarState.showGlobalFilterEditor = false }) }}
                        onFilterChanged={(filter) => {
                            runInAction(() => {
                                appState.filter = filter
                            })
                        }}
                    />
                )
            }
            <Box flex={'1 1 0'} mt={1} px={1}>
                <PeriodSelector />
            </Box>
            <Box px={1} display={'flex'} gap={1} justifyContent={'space-between'} alignItems={'center'}>
                <div>{'Theme:'}</div>
                <ToggleButtonGroup
                    size={'small'}
                    color={'primary'}
                    value={appState.theme}
                    exclusive
                    onChange={
                        (_, value: 'light' | 'dark' | 'auto' | null) => {
                            if (value !== null) {
                                runInAction(() => {
                                    appState.theme = value
                                })
                            }
                        }
                    }
                >
                    <ToggleButton value={'light'}>{'Light'}</ToggleButton>
                    <ToggleButton value={'dark'}>{'Dark'}</ToggleButton>
                    <ToggleButton value={'auto'}>{'Auto'}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => { runInAction(() => { appState.topBarState.showGlobalFilterEditor = true }) }}>
                        <ListItemIcon>
                            <FilterAlt />
                        </ListItemIcon>
                        <ListItemText primary={'Filter operations'} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => { runInAction(() => { appState.topBarState.showGlobalCurrencySelector = true }) }}>
                        <ListItemIcon>
                            {
                                run(() => {
                                    const icon = CURRENCIES[appState.masterCurrency].faIcon
                                    return icon !== undefined
                                        ? <FontAwesomeIcon icon={icon} fixedWidth />
                                        : (
                                                <DivBody1 width={20} textAlign={'center'} fontWeight={'bold'}>
                                                    {getCurrencySymbol(appState.masterCurrency)}
                                                </DivBody1>
                                            )
                                })
                            }
                        </ListItemIcon>
                        <ListItemText primary={'Master currency'} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton href={'https://t.me/+kBQ5Uy5y13UzNjk0'} target={'_blank'}>
                        <ListItemIcon>
                            <Telegram />
                        </ListItemIcon>
                        <ListItemText>{'Discuss'}</ListItemText>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton href={'https://github.com/rlz/cashmony/issues'} target={'_blank'}>
                        <ListItemIcon>
                            <GitHub />
                        </ListItemIcon>
                        <ListItemText>
                            {'Report issue'}
                        </ListItemText>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => {
                            void apiSync(authState, appState, engine)
                        }}
                    >
                        <ListItemIcon>
                            <CloudSync />
                        </ListItemIcon>
                        <ListItemText>
                            {`Sync (${lastSyncText})`}
                        </ListItemText>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => {
                            authState.logout()
                        }}
                    >
                        <ListItemIcon>
                            <Logout />
                        </ListItemIcon>
                        <ListItemText>
                            {`Logout (${authState.name})`}
                        </ListItemText>
                    </ListItemButton>
                </ListItem>
                {
                    !import.meta.env.PROD
                    && (
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={onOpenAdvance}
                            >
                                <ListItemIcon>
                                    <Dangerous />
                                </ListItemIcon>
                                <ListItemText>
                                    {`Advanced`}
                                </ListItemText>
                            </ListItemButton>
                        </ListItem>
                    )
                }
            </List>
        </Column>
    )
})
