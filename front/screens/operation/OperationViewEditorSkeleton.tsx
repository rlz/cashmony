import { Box, Skeleton, Typography, useTheme } from '@mui/material'
import { ReactElement } from 'react'

export function OperationViewEditorSkeleton(): ReactElement {
    const theme = useTheme()

    return (
        <Box
            sx={{
                px: 1,
                color: theme.palette.getContrastText(theme.palette.background.default)
            }}
        >
            <Box sx={{ py: 2 }}>
                <Typography component={'p'} variant={'body2'}>
                    <Skeleton width={90} sx={{ margin: '0 auto' }} />
                </Typography>
                <Typography variant={'h4'}>
                    <Skeleton width={180} sx={{ margin: '0 auto' }} />
                </Typography>
                <Typography component={'p'} variant={'body2'} sx={{ mt: 1 }}>
                    <Skeleton width={190} />
                    <Skeleton width={170} />
                    <Skeleton width={230} sx={{ mt: 1 }} />
                    <Skeleton width={270} />
                </Typography>
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
