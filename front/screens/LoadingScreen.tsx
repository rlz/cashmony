import { Stack } from '@mui/material'
import React, { type ReactElement } from 'react'

export function LoadingScreen(): ReactElement {
    return (
        <Stack direction={'column'} sx={{ mt: 3, textAlign: 'center' }}>
            {'Loading...'}
        </Stack>
    )
}
