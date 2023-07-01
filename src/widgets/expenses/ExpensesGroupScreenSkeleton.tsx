import React, { type ReactElement } from 'react'
import { MainScreen } from '../mainScreen/MainScreen'
import { Skeleton, Tab, Tabs, Typography } from '@mui/material'
import { PBody2 } from '../Typography'
import { Column } from '../Containers'

export function ExpensesGroupScreenSkeleton (): ReactElement {
    return <MainScreen
        navigateOnBack='/categories'
        title='Category'
        onSave={null}
    >
        <Typography variant='h6' mt={2}>
            <Skeleton width={75} sx={{ mx: 'auto' }} />
        </Typography>
        <Typography variant='h6' textAlign='center' color='primary.main' mb={1}>
            <Skeleton width={95} sx={{ mx: 'auto' }} />
        </Typography>
        <PBody2>
            <Skeleton width={125} sx={{ mx: 'auto' }} />
        </PBody2>
        <Tabs value={0} variant='fullWidth'>
            <Tab label={<Skeleton width={45} />}/>
            <Tab label={<Skeleton width={65}/>}/>
            <Tab label={<Skeleton width={35}/>}/>
        </Tabs>
        <Column gap={1} mt={1}>
            <Skeleton variant='rounded' height={85}/>
            <Skeleton variant='rounded' height={100}/>
            <Skeleton variant='rounded' height={80}/>
        </Column>
    </MainScreen>
}
