import { Avatar, Box, Paper, Typography } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../../helpers/currencies'

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

export function BaseOpCard (props: Props): ReactElement {
    const navigate = useNavigate()
    const color = props.color + '.light'

    return <a onClick={() => { navigate(`/operations/${props.opId}`) }}>
        <Paper elevation={1} sx={{ p: 1, display: 'flex', gap: 2 }}>
            <Box>
                <Avatar sx={{ bgcolor: color }}>{props.icon}</Avatar>
            </Box>
            <Box flex='1 1 0' minWidth={0}>
                <Typography component='div' display='flex'>
                    <Box
                        flex='1 1 0'
                        color={props.categoryGrey === true ? 'grey.500' : undefined}
                    >
                        {props.categoryName}
                    </Box>
                    <Box color={color}>
                        { formatCurrency(props.amount, props.currency) }
                    </Box>
                </Typography>
                {props.transferElement}
                <Typography variant='body2' component='div' display='flex'>
                    <Box flex='1 1 0'>
                        {props.tags.join(', ')}
                    </Box>
                    {
                        props.accountName !== null
                            ? <Box>
                                Acc.: {props.accountName}
                            </Box>
                            : null
                    }
                </Typography>
                <Typography variant='body2' fontStyle='italic' noWrap>
                    {(props.comment ?? '') === '' ? '\u00a0' : props.comment}
                </Typography>
            </Box>
        </Paper>
    </a>
}
