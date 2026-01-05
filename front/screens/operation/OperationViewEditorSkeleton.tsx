import { Box, Skeleton, Typography, useTheme } from '@mui/material'
import { ReactElement } from 'react'

import { PBody2 } from '../../widgets/generic/Typography.js'

export function OperationViewEditorSkeleton(): ReactElement {
    const theme = useTheme()

    return (
        <Box px={1} color={theme.palette.getContrastText(theme.palette.background.default)}>
            <Box py={2}>
                <PBody2>
                    <Skeleton width={90} sx={{ margin: '0 auto' }} />
                </PBody2>
                <Typography variant={'h4'}>
                    <Skeleton width={180} sx={{ margin: '0 auto' }} />
                </Typography>
                <PBody2 mt={1}>
                    <Skeleton width={190} />
                    <Skeleton width={170} />
                    <Skeleton width={230} sx={{ mt: 1 }} />
                    <Skeleton width={270} />
                </PBody2>
            </Box>
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 36, mt: 2 }} />
        </Box>
    )
}
