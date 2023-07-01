import { Avatar, Box, Paper, Skeleton } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../../helpers/currencies'
import { Row } from '../../Containers'
import { DivBody1, DivBody2 } from '../../Typography'
import { showIf } from '../../../helpers/smallTools'

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
                <Row gap={1}>
                    <DivBody1
                        flex='1 1 0'
                        minWidth={30}
                        color={props.categoryGrey === true ? 'grey.500' : undefined}
                        noWrap
                    >
                        {props.categoryName}
                    </DivBody1>
                    <DivBody1 color={color} noWrap >
                        { formatCurrency(props.amount, props.currency) }
                    </DivBody1>
                </Row>
                {props.transferElement}
                <Row gap={1}>
                    <DivBody2 flex='1 1 0' minWidth={30} noWrap >
                        {props.tags.join(', ')}
                    </DivBody2>
                    {
                        showIf(
                            props.accountName !== null,
                            <DivBody2 noWrap>Acc.: {props.accountName}</DivBody2>
                        )
                    }
                </Row>
                <DivBody2 fontStyle='italic' noWrap>
                    {(props.comment ?? '') === '' ? '\u00a0' : props.comment}
                </DivBody2>
            </Box>
        </Paper>
    </a>
}

export function OpCardSkeleton (): ReactElement {
    return <Paper elevation={1} sx={{ p: 1, display: 'flex', gap: 2 }}>
        <Box>
            <Skeleton variant='circular' width={40} height={40}/>
        </Box>
        <Box flex='1 1 0' minWidth={0}>
            <Row gap={1}>
                <DivBody1
                    flex='1 1 0'
                    minWidth={30}
                >
                    <Skeleton width={90} sx={{ maxWidth: '100%' }}/>
                </DivBody1>
                <DivBody1 flex='0 1 auto' minWidth={0}>
                    <Skeleton width={70} sx={{ maxWidth: '100%' }}/>
                </DivBody1>
            </Row>
            <Row gap={1}>
                <DivBody2 flex='1 1 0' minWidth={30}>
                    <Skeleton width={110} sx={{ maxWidth: '100%' }}/>
                </DivBody2>
                <DivBody2 flex='0 1 auto' minWidth={0}>
                    <Skeleton width={140} sx={{ maxWidth: '100%' }}/>
                </DivBody2>
            </Row>
            <DivBody2>
                <Skeleton width={80} sx={{ maxWidth: '100%' }}/>
            </DivBody2>
        </Box>
    </Paper>
}
