import { Box, useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type PropsWithChildren, type ReactElement } from 'react'

import { Column } from '../generic/Containers'
import { MainAppBar } from './MainAppBar'
import { MainBottomNavigation } from './MainBottomNavigation'

export const MainScreen = observer(function MainScreen ({ children }: PropsWithChildren): ReactElement {
    const theme = useTheme()

    return <Column width={'100vw'} height={'100vh'}>
        <MainAppBar />
        <Box
            display={'flex'}
            flexDirection={'column'}
            overflow={'scroll'}
            flex={'1 0 0'}
            bgcolor={theme.palette.background.default}
        >
            {children}
        </Box>
        <MainBottomNavigation />
    </Column>
})
