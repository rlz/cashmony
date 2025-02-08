import { Box, useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type PropsWithChildren, type ReactElement, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from 'rlz-engine/dist/client/state/auth'

import { Column } from '../generic/Containers'
import { MainAppBar } from './MainAppBar'
import { MainBottomNavigation } from './MainBottomNavigation'

export const MainScreen = observer(function MainScreen({ children }: PropsWithChildren): ReactElement {
    const authParam = useAuthState(i => i.getAuthParam())
    const navigate = useNavigate()
    const theme = useTheme()

    useEffect(() => {
        if (authParam === null) {
            void navigate('/signin')
        }
    }, [authParam])

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
