import React, { type PropsWithChildren, type ReactElement } from 'react'
import { EditorAppBar } from './EditorAppBar'
import { Box } from '@mui/material'

interface Props extends PropsWithChildren {
    title: string | null
    navigateOnBack?: string
    onSave?: (() => void) | (() => Promise<void>) | null
}

export function EditorScreen (props: Props): ReactElement {
    return <Box width="100vw" height="100vh" display="flex" flexDirection="column">
        <EditorAppBar
            title={props.title}
            navigateOnBack={props.navigateOnBack}
            onSave={props.onSave}
        />
        <Box
            display="flex"
            flexDirection="column"
            overflow="scroll"
            p={1}
            flex="1 0 0"
            bgcolor="background.default"
            color="text.primary"
        >
            {props.children}
        </Box>
    </Box>
}
