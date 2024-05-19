import { Box, useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type PropsWithChildren, type ReactElement, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useFrontState } from '../../model/FrontState'
import { Column } from '../generic/Containers'
import { MainAppBar } from './MainAppBar'
import { MainBottomNavigation } from './MainBottomNavigation'

export const MainScreen = observer(function MainScreen({ children }: PropsWithChildren): ReactElement {
    const appState = useFrontState()
    const navigate = useNavigate()
    const theme = useTheme()

    useEffect(() => {
        if (appState.auth === null) {
            navigate('/signin')
        }
    }, [appState.auth])

    return (
        <Column width={'100vw'} height={'100vh'}>
            <MainAppBar />
            <Box
                display={'flex'}
                flexDirection={'column'}
                overflow={'auto'}
                flex={'1 0 0'}
                bgcolor={theme.palette.background.default}
            >
                {children}
            </Box>
            <MainBottomNavigation />
        </Column>
    )
})
