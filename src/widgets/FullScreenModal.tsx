import React, { type ReactElement, type PropsWithChildren } from 'react'
import { Box, Portal } from '@mui/material'
import { EditorAppBar } from '../widgets/EditorAppBar'

interface Props extends PropsWithChildren {
    title: string | null
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
            <EditorAppBar
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
