import { Avatar, Box, Paper, Skeleton, Stack, Typography, useTheme } from '@mui/material'
import React, { type ReactElement } from 'react'

import { formatCurrency } from '../../../helpers/currencies.js'
import { showIf } from '../../../helpers/smallTools.js'

interface Props {
    opId: string
    color: 'error' | 'success' | 'warning' | 'info'
    icon: ReactElement
    categoryName: string
    categoryGrey?: boolean
    amount: number
    currency: string
    tags: readonly string[]
    accountName: string | null
    comment: string | null
    transferElement?: ReactElement
}

export function BaseOpCard(props: Props): ReactElement {
    const theme = useTheme()
    const color = `${props.color}.${theme.palette.mode === 'dark' ? 'light' : 'dark'}`

    return (
        <Paper variant={'outlined'}>
            <Stack direction={'row'} spacing={2} sx={{ p: 1 }}>
                <Box>
                    <Avatar sx={{ bgcolor: color }}>{props.icon}</Avatar>
                </Box>
                <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                    <Stack direction={'row'} sx={{ gap: 1 }}>
                        <Typography
                            component={'div'}
                            variant={'body1'}
                            sx={{
                                flex: '1 1 0',
                                minWidth: 30,
                                color: props.categoryGrey === true ? 'grey.500' : undefined
                            }}
                            noWrap
                        >
                            {props.categoryName}
                        </Typography>
                        <Typography component={'div'} variant={'body1'} color={color} noWrap>
                            { formatCurrency(props.amount, props.currency) }
                        </Typography>
                    </Stack>
                    {props.transferElement}
                    <Stack direction={'row'} sx={{ gap: 1 }}>
                        <Typography component={'div'} variant={'body2'} sx={{ flex: '1 1 0', minWidth: 30 }} noWrap>
                            {props.tags.join(', ')}
                        </Typography>
                        {
                            showIf(
                                props.accountName !== null,
                                <Typography component={'div'} variant={'body2'} noWrap>
                                    {'Acc.: '}
                                    {props.accountName}
                                </Typography>
                            )
                        }
                    </Stack>
                    <Typography component={'div'} variant={'body2'} sx={{ fontStyle: 'italic' }} noWrap>
                        {(props.comment ?? '') === '' ? '\u00a0' : props.comment}
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    )
}

export function OpCardSkeleton(): ReactElement {
    return (
        <Paper elevation={1}>
            <Stack direction={'row'} sx={{ p: 1, gap: 2 }}>
                <Box>
                    <Skeleton variant={'circular'} width={40} height={40} />
                </Box>
                <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                    <Stack direction={'row'} sx={{ gap: 1 }}>
                        <Typography
                            component={'div'}
                            variant={'body1'}
                            sx={{ flex: '1 1 0', minWidth: 30 }}
                        >
                            <Skeleton width={90} sx={{ maxWidth: '100%' }} />
                        </Typography>
                        <Typography component={'div'} variant={'body1'} sx={{ flex: '0 1 auto', minWidth: 0 }}>
                            <Skeleton width={70} sx={{ maxWidth: '100%' }} />
                        </Typography>
                    </Stack>
                    <Stack direction={'row'} sx={{ gap: 1 }}>
                        <Typography component={'div'} variant={'body2'} sx={{ flex: '1 1 0', minWidth: 30 }}>
                            <Skeleton width={110} sx={{ maxWidth: '100%' }} />
                        </Typography>
                        <Typography component={'div'} variant={'body2'} sx={{ flex: '0 1 auto', minWidth: 0 }}>
                            <Skeleton width={140} sx={{ maxWidth: '100%' }} />
                        </Typography>
                    </Stack>
                    <Typography component={'div'} variant={'body2'}>
                        <Skeleton width={80} sx={{ maxWidth: '100%' }} />
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    )
}
