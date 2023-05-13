import React, { type PropsWithChildren, type ReactElement } from 'react'
import { Box, useTheme } from '@mui/material'
import { MainAppBar } from './MainAppBar'
import { MainBottomNavigation } from './MainBottomNavigation'

export const MainScreen = (props: PropsWithChildren<unknown>): ReactElement => {
    const theme = useTheme()

    return <>
        <Box width="100vw" height="100vh" display="flex" flexDirection="column">
            <MainAppBar />
            <Box
                overflow="scroll"
                flex="1 0 0"
                bgcolor={theme.palette.background.default}
            >
                {props.children}
            </Box>
            <MainBottomNavigation />
        </Box>
    </>
}
