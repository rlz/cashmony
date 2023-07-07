import { Box, useTheme } from '@mui/material'
import React, { type PropsWithChildren, type ReactElement } from 'react'

import { Column } from '../Containers'
import { MainAppBar } from './MainAppBar'
import { MainBottomNavigation } from './MainBottomNavigation'

export type OnSaveType = (() => void) | (() => Promise<void>) | null | undefined

interface Props extends PropsWithChildren {
    title?: string
    navigateOnBack?: string
    onSave?: OnSaveType
}

export const MainScreen = (props: Props): ReactElement => {
    const theme = useTheme()

    return <Column width='100vw' height='100vh'>
        <MainAppBar
            title={props.title}
            navigateOnBack={props.navigateOnBack}
            onSave={props.onSave}
        />
        <Box
            display='flex'
            flexDirection='column'
            overflow='scroll'
            flex='1 0 0'
            bgcolor={theme.palette.background.default}
        >
            {props.children}
        </Box>
        <MainBottomNavigation />
    </Column>
}
