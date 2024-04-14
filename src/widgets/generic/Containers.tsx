import { Box, type BoxProps } from '@mui/material'
import React, { type PropsWithChildren, type ReactElement } from 'react'

export function Row(props: PropsWithChildren<Omit<BoxProps, 'display' | 'flexDirection'>>): ReactElement {
    return <Box display={'flex'} {...props}>
        {props.children}
    </Box>
}

export function Column(props: PropsWithChildren<Omit<BoxProps, 'display' | 'flexDirection'>>): ReactElement {
    return <Box display={'flex'} flexDirection={'column'} {...props}>
        {props.children}
    </Box>
}
