import { Box, useTheme } from '@mui/material'
import React, { type ReactElement, useEffect } from 'react'
import { Group, Panel } from 'react-resizable-panels'
import { useLocation, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { showIfLazy } from '../../helpers/smallTools.js'
import { screenWidthIs } from '../../helpers/useWidth.js'
import { useFrontState } from '../../model/FrontState.js'
import { useAbsoluteNavigate } from '../../useAbsoluteNavigate.js'
import { ResizeHandle } from '../../widgets/generic/resizeHandle.js'
import { MainScreen } from '../../widgets/mainScreen/MainScreen.js'
import { AddOperationFab } from '../../widgets/operations/AddOperationFab.js'
import { OpsList } from '../../widgets/operations/OpsList.js'
import { OperationViewEditor } from './OperationViewEditor.js'

export function OperationScreen(): ReactElement {
    const appState = useFrontState()

    const location = useLocation()
    const navigate = useAbsoluteNavigate()
    const pathParams = useParams()
    const smallScreen = screenWidthIs('xs', 'sm')
    const theme = useTheme()

    const opId = match(location.pathname)
        .with('/new-op/expense', () => 'new-expense')
        .with('/new-op/income', () => 'new-income')
        .with('/new-op/transfer', () => 'new-transfer')
        .otherwise(() => pathParams.opId ?? '')

    useEffect(() => {
        if (opId === '') {
            appState.setSubTitle('Operations')
            appState.setOnClose(null)
            return
        }

        appState.setOnClose(() => {
            navigate('/operations')
        })
    }, [opId])

    return (
        <MainScreen>
            {
                !smallScreen
                    ? (
                            <Group orientation={'horizontal'} style={{ height: '100%' }}>
                                <Panel id={'list'}>
                                    <Box height={'100%'} overflow={'auto'}>
                                        <Box p={1} height={'100%'} maxWidth={900} mx={'auto'}>
                                            <OpsList />
                                            { opId === '' && <AddOperationFab /> }
                                        </Box>
                                    </Box>
                                </Panel>
                                {
                                    showIfLazy(opId !== '', () => (
                                        <>
                                            <ResizeHandle />
                                            <Panel id={'single'}>
                                                <Box p={1} overflow={'auto'} height={'100%'}>
                                                    <OperationViewEditor urlOpId={opId} />
                                                </Box>
                                            </Panel>
                                        </>
                                    ))
                                }
                            </Group>
                        )
                    : (
                            <Box position={'relative'} height={'100%'}>
                                <Box p={1} height={'100%'} overflow={'auto'}>
                                    <OpsList />
                                    { opId === '' && <AddOperationFab /> }
                                </Box>
                                {
                                    showIfLazy(opId !== '', () => {
                                        return (
                                            <Box
                                                p={1}
                                                position={'absolute'}
                                                top={0}
                                                left={0}
                                                width={'100%'}
                                                height={'100%'}
                                                bgcolor={theme.palette.background.default}
                                            >
                                                <OperationViewEditor urlOpId={opId} />
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
