import { Skeleton, Tab, Tabs, Typography } from '@mui/material'
import React, { type ReactElement } from 'react'

import { Column } from '../generic/Containers.js'
import { DivBody2, PBody2 } from '../generic/Typography.js'

export function ExpensesGroupScreenSkeleton(): ReactElement {
    return (
        <>
            <Typography variant={'h6'} mt={2}>
                <Skeleton width={75} sx={{ mx: 'auto' }} />
            </Typography>
            <Typography variant={'h6'} textAlign={'center'} color={'primary.main'} mb={1}>
                <Skeleton width={95} sx={{ mx: 'auto' }} />
            </Typography>
            <PBody2>
                <Skeleton width={125} sx={{ mx: 'auto' }} />
            </PBody2>
            <Tabs value={0} variant={'fullWidth'}>
                <Tab label={<Skeleton width={45} />} />
                <Tab label={<Skeleton width={65} />} />
                <Tab label={<Skeleton width={35} />} />
            </Tabs>
            <DivBody2 mt={2}>
                <Skeleton width={135} sx={{ mx: 'auto' }} />
                <Skeleton width={135} sx={{ mx: 'auto' }} />
            </DivBody2>
            <Column gap={1} mt={2}>
                <Skeleton variant={'rounded'} height={85} />
                <Skeleton variant={'rounded'} height={100} />
                <Skeleton variant={'rounded'} height={80} />
            </Column>
        </>
    )
}
