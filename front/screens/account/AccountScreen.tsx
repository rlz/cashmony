import { Box, useTheme } from '@mui/material'
import React, { type ReactElement, useEffect } from 'react'
import { Group, Panel } from 'react-resizable-panels'
import { useLocation } from 'react-router-dom'

import { showIfLazy } from '../../helpers/smallTools.js'
import { screenWidthIs } from '../../helpers/useWidth.js'
import { useFrontState } from '../../model/FrontState.js'
import { ResizeHandle } from '../../widgets/generic/resizeHandle.js'
import { MainScreen } from '../../widgets/mainScreen/MainScreen.js'
import { AccountBody } from './AccountBody.js'
import { AccountsBody } from './AccountsBody.js'

export function AccountScreen(): ReactElement {
    const appState = useFrontState()
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
                            <Group orientation={'horizontal'} style={{ height: '100%' }}>
                                <Panel id={'list'}>
                                    <AccountsBody noFab={accSelected} />
                                </Panel>
                                {
                                    showIfLazy(accSelected, () => {
                                        return (
                                            <>
                                                <ResizeHandle />
                                                <Panel id={'single'}>
                                                    <AccountBody />
                                                </Panel>
                                            </>
                                        )
                                    })
                                }
                            </Group>
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
