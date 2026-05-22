import { Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material'
import React, { type ReactElement } from 'react'

export function ExpensesGroupScreenSkeleton(): ReactElement {
    return (
        <>
            <Typography variant={'h6'} sx={{ mt: 2 }}>
                <Skeleton width={75} sx={{ mx: 'auto' }} />
            </Typography>
            <Typography variant={'h6'} sx={{ textAlign: 'center', color: 'primary.main', mb: 1 }}>
                <Skeleton width={95} sx={{ mx: 'auto' }} />
            </Typography>
            <Typography component={'p'} variant={'body2'}>
                <Skeleton width={125} sx={{ mx: 'auto' }} />
            </Typography>
            <Tabs value={0} variant={'fullWidth'}>
                <Tab label={<Skeleton width={45} />} />
                <Tab label={<Skeleton width={65} />} />
                <Tab label={<Skeleton width={35} />} />
            </Tabs>
            <Typography component={'div'} variant={'body2'} sx={{ mt: 2 }}>
                <Skeleton width={135} sx={{ mx: 'auto' }} />
                <Skeleton width={135} sx={{ mx: 'auto' }} />
            </Typography>
            <Stack direction={'column'} sx={{ gap: 1, mt: 2 }}>
                <Skeleton variant={'rounded'} height={85} />
                <Skeleton variant={'rounded'} height={100} />
                <Skeleton variant={'rounded'} height={80} />
            </Stack>
        </>
    )
}
