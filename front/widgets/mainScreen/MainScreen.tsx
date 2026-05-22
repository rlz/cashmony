import { Stack, useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type PropsWithChildren, type ReactElement, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from 'rlz-engine/client/state/auth.js'

import { MainAppBar } from './MainAppBar.js'
import { MainBottomNavigation } from './MainBottomNavigation.js'

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
        <Stack direction={'column'} sx={{ width: '100vw', height: '100vh' }}>
            <MainAppBar />
            <Stack
                direction={'column'}
                sx={{
                    overflow: 'auto',
                    flex: '1 0 0',
                    bgcolor: theme.palette.background.default
                }}
            >
                {children}
            </Stack>
            <MainBottomNavigation />
        </Stack>
    )
})
