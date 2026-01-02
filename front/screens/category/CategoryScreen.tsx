import { Box, useTheme } from '@mui/material'
import React, { type ReactElement, useEffect } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useLocation } from 'react-router-dom'

import { showIfLazy } from '../../helpers/smallTools.js'
import { screenWidthIs } from '../../helpers/useWidth.js'
import { useFrontState } from '../../model/FrontState.js'
import { ResizeHandle } from '../../widgets/generic/resizeHandle.js'
import { MainScreen } from '../../widgets/mainScreen/MainScreen.js'
import { CategoriesScreenBody } from './CategoriesBody.js'
import { CategoryScreenBody } from './CategoryBody.js'

export function CategoryScreen(): ReactElement {
    const appState = useFrontState()
    const smallScreen = screenWidthIs('xs', 'sm')
    const location = useLocation()
    const theme = useTheme()
    const noCatSelected = location.pathname === '/categories'

    useEffect(() => {
        if (noCatSelected) {
            appState.setSubTitle('Categories')
            appState.setOnClose(null)
        }
    }, [noCatSelected])

    return (
        <MainScreen>
            {
                smallScreen
                    ? (
                            <Box height={'100%'} position={'relative'}>
                                <Box height={'100%'}>
                                    <CategoriesScreenBody noFab={!noCatSelected} />
                                </Box>
                                {
                                    showIfLazy(!noCatSelected, () => {
                                        return (
                                            <Box
                                                position={'absolute'}
                                                top={0}
                                                left={0}
                                                height={'100%'}
                                                width={'100%'}
                                                bgcolor={theme.palette.background.default}
                                            >
                                                <CategoryScreenBody />
                                            </Box>
                                        )
                                    })
                                }
                            </Box>
                        )
                    : (
                            <PanelGroup direction={'horizontal'}>
                                <Panel id={'list'} order={1}>
                                    <CategoriesScreenBody noFab={!noCatSelected} />
                                </Panel>
                                {
                                    showIfLazy(!noCatSelected, () => {
                                        return (
                                            <>
                                                <ResizeHandle />
                                                <Panel id={'single'} order={2}>
                                                    <CategoryScreenBody />
                                                </Panel>
                                            </>
                                        )
                                    })
                                }
                            </PanelGroup>
                        )
            }
        </MainScreen>
    )
}
