import React, { useState, type ReactElement } from 'react'
import { observer } from 'mobx-react-lite'
import { Avatar, Backdrop, Box, Paper, SpeedDial, SpeedDialAction, SpeedDialIcon, Typography, useTheme } from '@mui/material'
import { type NotDeletedOperation, type OperationsModel } from '../model/operations'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightLong, faCreditCard, faExclamation, faHandHoldingDollar, faMoneyBillTransfer, faWallet } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { MainScreen } from '../widgets/MainScreen'

const Fab = (): ReactElement => {
    const [open, setOpen] = useState(false)

    return <>
        <Backdrop open={open} sx={{ backdropFilter: 'grayscale(30%) brightness(300%) blur(2px)' }} />
        <SpeedDial
            sx={{ position: 'absolute', bottom: 70, right: 16 }}
            icon={<SpeedDialIcon />}
            ariaLabel="add"
            open={open}
            onOpen={() => { setOpen(true) }}
            onClose={() => { setOpen(false) }}
        >
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faCreditCard}/>}
                tooltipOpen
                tooltipTitle="Expence"
                FabProps={{ color: 'error', size: 'medium' }}
            />
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faHandHoldingDollar} />}
                tooltipOpen
                tooltipTitle="Income"
                FabProps={{ color: 'success', size: 'medium' }}
            />
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faMoneyBillTransfer} />}
                tooltipOpen
                tooltipTitle="Transfer"
                FabProps={{ color: 'info', size: 'medium' }}
            />
        </SpeedDial>
    </>
}

export const OperationsScreen = observer(
    ({ operationsModel }: { operationsModel: OperationsModel }): ReactElement => {
        const theme = useTheme()

        return <MainScreen>
            <Box
                id="OperationsScreen"
                flex="1 0 0"
                sx={{
                    backgroundColor: theme.palette.background.default,
                    paddingBottom: '90px'
                }}
            >
                {operationsModel.displayOperations.map(group =>
                    <Box key={group[0].date.toISODate()}>
                        <Box px={theme.spacing(1)} pt={theme.spacing(2)}>
                            <Typography
                                variant='h6'
                                color={theme.palette.getContrastText(theme.palette.background.default)}
                            >
                                {group[0].date.toLocaleString({ dateStyle: 'full' })}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(1), padding: theme.spacing(1) }}>
                            {group.map(t => <Transaction key={t.id} op={t}/>)}
                        </Box>
                    </Box>
                )}
                <Fab />
            </Box>
        </MainScreen>
    }
)

function Transaction ({ op }: { op: NotDeletedOperation }): ReactElement {
    const theme = useTheme()
    const navigate = useNavigate()

    const color = {
        adjustment: theme.palette.warning,
        transfer: theme.palette.info,
        expense: theme.palette.error,
        income: theme.palette.success
    }[op.type]

    const IconBox = (): ReactElement => <Box>
        <Avatar sx={{ bgcolor: color.light }}>
            <FontAwesomeIcon icon={{
                adjustment: faExclamation,
                transfer: faMoneyBillTransfer,
                expense: faCreditCard,
                income: faHandHoldingDollar
            }[op.type]}
            />
        </Avatar>
    </Box>

    const Amount = ({ amount }: { amount: number }): ReactElement => <Typography variant='body1' color={color.dark}>
        {
            amount.toLocaleString(
                undefined,
                {
                    style: 'currency',
                    currency: op.currency,
                    currencyDisplay: 'narrowSymbol'
                }
            )
        }
    </Typography>

    if (op.type === 'adjustment') {
        return <MainScreen>
            <Paper elevation={4} sx={{ p: 1 }}>
                <Box display='flex' gap={theme.spacing(2)}>
                    <IconBox />
                    <Box flex="1 0 0">
                        <Box display="flex">
                            <Typography variant='body1' flex="1 0 0" color={theme.palette.grey[500]}>
                            Adjustment
                            </Typography>
                            <Box textAlign="right">
                                <Amount amount={op.amount}/>
                                <Typography variant='body2'>
                                    <FontAwesomeIcon icon={faWallet}/> {op.account.name}
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant='body2' fontStyle="italic">
                            {(op.comment ?? '') === '' ? '\u00a0' : op.comment}
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </MainScreen>
    }

    if (op.type === 'transfer') {
        return <Paper elevation={4} sx={{ p: 1 }}>
            <Box display='flex' gap={theme.spacing(2)}>
                <IconBox />
                <Box flex="1 0 0">
                    <Box display="flex">
                        <Typography variant='body1' flex="1 0 0" color={theme.palette.grey[500]}>
                            Transfer
                        </Typography>
                        <Amount amount={op.amount} />
                    </Box>
                    <Typography variant='body2'>
                        {op.account.name} ({op.account.amount.toFixed(2)})
                        {' '}<FontAwesomeIcon icon={faArrowRightLong} />{' '}
                        {op.toAccount.name} ({op.toAccount.amount.toFixed(2)})
                    </Typography>
                    <Typography variant='body2' fontStyle="italic">
                        {(op.comment ?? '') === '' ? '\u00a0' : op.comment}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    }

    if (['expense', 'income'].includes(op.type)) {
        return <a onClick={() => {
            navigate(`/operations/${op.id}`)
        }}>
            <Paper elevation={4} sx={{ p: 1 }}>
                <Box display='flex' gap={theme.spacing(2)}>
                    <IconBox />
                    <Box flex="1 0 0">
                        <Box display="flex">
                            <Box flex="1 0 0">
                                <Typography variant='body1'>
                                    {
                                        op.categories.length === 0
                                            ? <Typography component="span" color={theme.palette.grey[500]}>No category</Typography>
                                            : (
                                                op.categories.length === 1
                                                    ? op.categories[0].name
                                                    : `${op.categories.length} categories`
                                            )
                                    }
                                </Typography>
                                <Typography variant='body2'>
                                    {op.tags.join(', ')}
                                </Typography>
                            </Box>
                            <Box textAlign="right">
                                <Amount amount={Math.abs(op.amount)}/>
                                <Typography variant='body2'>
                                    <FontAwesomeIcon icon={faWallet}/> {op.account.name}
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant='body2' fontStyle="italic">
                            {(op.comment ?? '') === '' ? '\u00a0' : op.comment}
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </a>
    }

    console.log(op)
    throw Error(`Unexpected operation type: ${op.type}`)
}
