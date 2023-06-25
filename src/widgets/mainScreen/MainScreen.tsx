import React, { type PropsWithChildren, type ReactElement } from 'react'
import { Box, useTheme } from '@mui/material'
import { MainAppBar } from './MainAppBar'
import { MainBottomNavigation } from './MainBottomNavigation'

interface Props extends PropsWithChildren {
    title?: string
    navigateOnBack?: string
    onSave?: (() => void) | (() => Promise<void>) | null
}

export const MainScreen = (props: Props): ReactElement => {
    const theme = useTheme()

    return <Box width="100vw" height="100vh" display="flex" flexDirection="column">
        <MainAppBar
            title={props.title}
            navigateOnBack={props.navigateOnBack}
            onSave={props.onSave}
        />
        <Box
            display="flex"
            flexDirection="column"
            overflow="scroll"
            flex="1 0 0"
            bgcolor={theme.palette.background.default}
        >
            {props.children}
        </Box>
        <MainBottomNavigation />
    </Box>
}
