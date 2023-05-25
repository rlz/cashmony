import React, { type ReactElement, type PropsWithChildren } from 'react'
import { Box } from '@mui/material'
import { EditorAppBar } from '../widgets/EditorAppBar'

interface Props extends PropsWithChildren {
    title: string | null
    gap?: number
    onClose: () => void
    onSave?: () => void
}

export const FullScreenModal = (props: Props): ReactElement => {
    return <Box
        top={0}
        left={0}
        width="100vw"
        height="100vh"
        position="absolute"
        zIndex={1}
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
            px={1}
            bgcolor='background.default'
        >
            {props.children}
        </Box>
    </Box>
}
