import React, { type ReactElement, type PropsWithChildren } from 'react'
import { Box, Portal } from '@mui/material'
import { MainAppBar } from './MainAppBar'

interface Props extends PropsWithChildren {
    title?: string
    gap?: number
    onClose: () => void
    onSave?: (() => void) | null
}

export const FullScreenModal = (props: Props): ReactElement => {
    return <Portal>
        <Box
            top={0}
            left={0}
            width="100vw"
            height="100vh"
            position="absolute"
            zIndex={10000}
            display="flex"
            flexDirection="column"
            bgcolor="background.default"
            color="text.primary"
        >
            <MainAppBar
                noDrawer
                title={props.title}
                onBack={props.onClose}
                onSave={props.onSave}
            />
            <Box
                display="flex"
                flexDirection="column"
                textOverflow="scroll"
                flex="1 0 0"
                gap={props.gap}
                p={1}
                bgcolor='background.default'
            >
                {props.children}
            </Box>
        </Box>
    </Portal>
}
