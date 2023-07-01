import React, { type ReactElement } from 'react'
import { PanelResizeHandle } from 'react-resizable-panels'
import { Column } from '../Containers'
import { Box } from '@mui/material'

export function ResizeHandle (): ReactElement {
    return <PanelResizeHandle>
        <Column justifyContent='center' height='100%'>
            <Box borderRadius={500} bgcolor='secondary.main' height={20} width={5}></Box>
        </Column>
    </PanelResizeHandle>
}
