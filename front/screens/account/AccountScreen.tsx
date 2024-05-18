import { Box, useTheme } from '@mui/material'
import React, { type ReactElement, useEffect } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useLocation } from 'react-router-dom'

import { showIfLazy } from '../../helpers/smallTools'
import { screenWidthIs } from '../../helpers/useWidth'
import { useAppState } from '../../model/AppState'
import { ResizeHandle } from '../../widgets/generic/resizeHandle'
import { MainScreen } from '../../widgets/mainScreen/MainScreen'
import { AccountBody } from './AccountBody'
import { AccountsBody } from './AccountsBody'

export function AccountScreen(): ReactElement {
    const appState = useAppState()
    const smallScreen = screenWidthIs('xs', 'sm')
    const location = useLocation()
    const theme = useTheme()
    const accSelected = location.pathname !== '/accounts'

    useEffect(() => {
        if (!accSelected) {
            appState.setSubTitle('Accounts')
            appState.setOnClose(null)
        }
    }, [accSelected])

    return (
        <MainScreen>
            {
                !smallScreen
                    ? (
                        <PanelGroup direction={'horizontal'}>
                            <Panel id={'list'} order={1}>
                                <AccountsBody noFab={accSelected} />
                            </Panel>
                            {
                                showIfLazy(accSelected, () => {
                                    return (
                                        <>
                                            <ResizeHandle />
                                            <Panel id={'single'} order={2}>
                                                <AccountBody />
                                            </Panel>
                                        </>
                                    )
                                })
                            }
                        </PanelGroup>
                        )
                    : (
                        <Box height={'100%'} position={'relative'}>
                            <Box height={'100%'}>
                                <AccountsBody noFab={accSelected} />
                            </Box>
                            {
                                showIfLazy(accSelected, () => {
                                    return (
                                        <Box
                                            position={'absolute'}
                                            top={0}
                                            left={0}
                                            height={'100%'}
                                            width={'100%'}
                                            bgcolor={theme.palette.background.default}
                                        >
                                            <AccountBody />
                                        </Box>
                                    )
                                })
                            }
                        </Box>
                        )

        }
        </MainScreen>
    )
}
