import React, { useState, useEffect, type ReactElement } from 'react'
import { type Operations } from '../model/stats'
import { type NotDeletedOperation } from '../model/model'
import { Avatar, Box, Paper, Typography } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightLong, faCreditCard, faExclamation, faHandHoldingDollar, faMoneyBillTransfer, faWallet } from '@fortawesome/free-solid-svg-icons'
import { formatCurrency } from '../helpers/currencies'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { AccountsModel } from '../model/accounts'
import { AppState } from '../model/appState'
import { OperationsModel } from '../model/operations'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()

interface Props {
    operations: Operations<NotDeletedOperation>
}

export const OpsList = observer((props: Props): ReactElement => {
    const displayOps = [...props.operations.groupByDate({ reverse: true })]
    const [displayDays, setDisplayDays] = useState(Math.min(displayOps.length, 30))

    useEffect(() => {
        setDisplayDays(Math.min(displayOps.length, 30))
    }, [appState.timeSpanInfo, operationsModel.operations])

    return <>
        {displayOps.slice(0, displayDays).map(group =>
            <Box key={group[0].date.toISODate()}>
                <Box pt={2}>
                    <Typography
                        variant='body2'
                    >
                        {group[0].date.toLocaleString({ dateStyle: 'full' })}
                    </Typography>
                </Box>
                <Box display='flex' flexDirection='column' gap={1}>
                    {group.map(t => <Transaction key={t.id} op={t}/>)}
                </Box>
            </Box>
        )}
        {displayDays < displayOps.length
            ? <Typography color="text.primary" textAlign="center" mt={2}>
                <a onClick={() => {
                    setDisplayDays(Math.min(displayOps.length, displayDays + 10))
                }}>Show more</a>
            </Typography>
            : null
        }
    </>
})

const accountsModel = AccountsModel.instance()

const Transaction = observer(({ op }: { op: NotDeletedOperation }): ReactElement => {
    const navigate = useNavigate()

    const color = {
        adjustment: 'warning',
        transfer: 'info',
        expense: 'error',
        income: 'success'
    }[op.type] + '.light'

    const IconBox = (): ReactElement => <Box>
        <Avatar sx={{ bgcolor: color }}>
            <FontAwesomeIcon icon={{
                adjustment: faExclamation,
                transfer: faMoneyBillTransfer,
                expense: faCreditCard,
                income: faHandHoldingDollar
            }[op.type]}
            />
        </Avatar>
    </Box>

    const Amount = ({ amount }: { amount: number }): ReactElement => <Typography variant='body1' color={color}>
        { formatCurrency(amount, op.currency) }
    </Typography>

    const wrap = (el: ReactElement): ReactElement => {
        return <a onClick={() => {
            navigate(`/operations/${op.id}`)
        }}>
            <Paper elevation={1} sx={{ p: 1 }}>
                <Box display='flex' gap={2}>
                    <IconBox />
                    <Box flex="1 1 0" minWidth={0}>{el}</Box>
                </Box>
            </Paper>
        </a>
    }

    if (op.type === 'adjustment') {
        return wrap(<>
            <Box display="flex">
                <Typography variant='body1' flex="1 0 0" color="grey.500">
                    Adjustment
                </Typography>
                <Box textAlign="right">
                    <Amount amount={op.amount}/>
                    <Typography variant='body2'>
                        <FontAwesomeIcon icon={faWallet}/> {op.account.name}
                    </Typography>
                </Box>
            </Box>
            <Typography variant='body2' fontStyle="italic" noWrap>
                {(op.comment ?? '') === '' ? '\u00a0' : op.comment}
            </Typography>
        </>)
    }

    if (op.type === 'transfer') {
        const fromCurrency = accountsModel.get(op.account.name).currency
        const toCurrency = accountsModel.get(op.toAccount.name).currency

        const formatAccountAmount = (amount: number, currency: string): string | null =>
            op.amount === Math.abs(amount) && op.currency === currency
                ? null
                : ` (${formatCurrency(amount, currency)})`

        return wrap(<>
            <Box display="flex">
                <Typography variant='body1' flex="1 0 0" color="grey.500">
                            Transfer
                </Typography>
                <Amount amount={op.amount} />
            </Box>
            <Typography variant='body2'>
                {op.account.name}
                { formatAccountAmount(op.account.amount, fromCurrency) }
                {' '}<FontAwesomeIcon icon={faArrowRightLong} />{' '}
                {op.toAccount.name}
                { formatAccountAmount(op.toAccount.amount, toCurrency) }
            </Typography>
            <Typography variant='body2' fontStyle="italic" noWrap>
                {(op.comment ?? '') === '' ? '\u00a0' : op.comment}
            </Typography>
        </>)
    }

    if (['expense', 'income'].includes(op.type)) {
        return wrap(<>
            <Box display="flex">
                <Box flex="1 0 0">
                    <Typography variant='body1'>
                        {
                            op.categories.length === 0
                                ? <Typography component="span" color="grey.500">No category</Typography>
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
            <Typography variant='body2' fontStyle="italic" noWrap>
                {(op.comment ?? '') === '' ? '\u00a0' : op.comment}
            </Typography>
        </>)
    }

    console.log(op)
    throw Error(`Unexpected operation type: ${op.type}`)
})
