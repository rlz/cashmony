import { Box, Stack } from '@mui/material'
import React, { type ReactElement } from 'react'
import { Separator } from 'react-resizable-panels'

export function ResizeHandle(): ReactElement {
    return (
        <Separator>
            <Stack direction={'column'} sx={{ justifyContent: 'center', height: '100%' }}>
                <Box sx={{ borderRadius: 500, bgcolor: 'secondary.main', height: 20, width: 5 }}></Box>
            </Stack>
        </Separator>
    )
}
