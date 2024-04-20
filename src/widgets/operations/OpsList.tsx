import { AddCard as AddCardIcon, CreditCard as CreditCardIcon, CurrencyExchange as CurrencyExchangeIcon } from '@mui/icons-material'
import { Backdrop, Box, Portal, Skeleton, SpeedDial, SpeedDialAction, SpeedDialIcon, Stack, Typography, useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { formatCurrency } from '../../helpers/currencies'
import { runAsync, showIf } from '../../helpers/smallTools'
import { AppState } from '../../model/appState'
import { type NotDeletedOperation } from '../../model/model'
import { OperationsModel } from '../../model/operations'
import { PE, type Predicate } from '../../model/predicateExpression'
import { calcStats } from '../../model/stats'
import { opsPerIterval, perIntervalExpensesReducer } from '../../model/statsReducers'
import { Column } from '../generic/Containers'
import { DivBody2 } from '../generic/Typography'
import { AdjustmentCard } from './cards/AdjustmentCard'
import { OpCardSkeleton } from './cards/BaseOpCard'
import { ExpenseCard } from './cards/ExpenseCard'
import { IncomeCard } from './cards/IncomeCard'
import { TransferCard } from './cards/TransferCard'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()

interface Props {
    onOpClick?: (opId: string) => void
    noFab?: boolean
    predicate?: Predicate
    operations?: NotDeletedOperation[][]
}

export const OpsList = observer((props: Props): ReactElement => {
    const theme = useTheme()
    const navigate = useNavigate()
    const [displayOps, setDisplayOps] = useState<NotDeletedOperation[][] | null>(null)
    const [perDayExpenses, setPerDayExpenses] = useState<number[] | null>(null)
    const [displayDays, setDisplayDays] = useState(30)

    const masterCurrency = appState.masterCurrency
    const conrastColor = theme.palette.mode === 'dark' ? 'light' : 'dark'

    useEffect(() => {
        if (displayOps === null) {
            return
        }

        setDisplayDays(Math.min(displayOps.length, 30))
    }, [appState.timeSpanInfo, operationsModel.operations, displayOps])

    useEffect(
        () => {
            runAsync(async () => {
                if (props.operations === undefined) {
                    if (operationsModel.operations === null) {
                        return
                    }

                    const appState = AppState.instance()
                    const predicate = props.predicate ?? PE.filter(appState.filter)
                    const stats = await calcStats(predicate, appState.timeSpan, appState.today, {
                        opsByDate: opsPerIterval('day', false),
                        perDayExpenses: perIntervalExpensesReducer('day', PE.any(), masterCurrency)
                    })
                    setDisplayOps(stats.opsByDate.reverse())
                    setPerDayExpenses(stats.perDayExpenses.slice(0, stats.opsByDate.length).reverse())
                    return
                }
                setDisplayOps(props.operations)
            })
        },
        [props.operations, props.predicate, operationsModel.operations, appState.filter, appState.timeSpan]
    )

    if (displayOps === null) {
        return <Box height={'100%'} overflow={'hidden'}>
            <DivBody2 pt={2}>
                <Skeleton width={80} sx={{ maxWidth: '100%' }} />
            </DivBody2>
            <Column gap={1}>
                <OpCardSkeleton />
                <OpCardSkeleton />
                <OpCardSkeleton />
            </Column>
        </Box>
    }

    return <Box height={'100%'}>
        {displayOps.slice(0, displayDays).map((group, i) =>
            <Box key={group[0].date.toISODate()}>
                <Stack direction={'row'} spacing={1} justifyContent={'space-between'} pt={3} pb={1}>
                    <DivBody2 fontWeight={'bold'}>
                        {group[0].date.toLocaleString({ dateStyle: 'full' })}
                    </DivBody2>
                    <DivBody2 color={`error.${conrastColor}`} fontWeight={'bold'}>
                        {perDayExpenses === null ? undefined : formatCurrency(-perDayExpenses[i], masterCurrency)}
                    </DivBody2>
                </Stack>
                <Column gap={1}>
                    {group.map(op => <a
                        key={op.id}
                        onClick={() => {
                            if (props.onOpClick !== undefined) {
                                props.onOpClick(op.id)
                                return
                            }
                            navigate(`/operations/${op.id}`)
                        }}
                                     >
                        <Transaction op={op} />
                    </a>)}
                </Column>
            </Box>
        )}
        {displayOps !== null && displayDays < displayOps.length
            ? <Typography color={'text.primary'} textAlign={'center'} mt={2}>
                <a onClick={() => {
                    setDisplayDays(Math.min(displayOps.length, displayDays + 10))
                }}
                >
                    {'Show more'}
                </a>
            </Typography>
            : null}
        <Box minHeight={144} />
        {
            showIf(props.noFab !== true, <Fab />)
        }
    </Box>
})
OpsList.displayName = 'OpsList'

const Transaction = ({ op }: { op: NotDeletedOperation }): ReactElement => {
    if (op.type === 'adjustment') {
        return <AdjustmentCard operation={op} />
    }

    if (op.type === 'transfer') {
        return <TransferCard operation={op} />
    }

    if (op.type === 'income') {
        return <IncomeCard operation={op} />
    }

    return <ExpenseCard operation={op} />
}

const Fab = (): ReactElement => {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    return <Portal>
        <Backdrop open={open} sx={{ backdropFilter: 'grayscale(30%) brightness(300%) blur(2px)' }} />
        <SpeedDial
            sx={{ position: 'fixed', bottom: 70, right: 16 }}
            icon={<SpeedDialIcon />}
            ariaLabel={'add'}
            open={open}
            onOpen={() => { setOpen(true) }}
            onClose={() => { setOpen(false) }}
        >
            <SpeedDialAction
                icon={<CreditCardIcon />}
                tooltipOpen
                tooltipTitle={'Expence'}
                FabProps={{ color: 'error', size: 'medium' }}
                onClick={() => { navigate('/new-op/expense') }}
            />
            <SpeedDialAction
                icon={<AddCardIcon />}
                tooltipOpen
                tooltipTitle={'Income'}
                FabProps={{ color: 'success', size: 'medium' }}
                onClick={() => { navigate('/new-op/income') }}
            />
            <SpeedDialAction
                icon={<CurrencyExchangeIcon />}
                tooltipOpen
                tooltipTitle={'Transfer'}
                FabProps={{ color: 'info', size: 'medium' }}
                onClick={() => { navigate('/new-op/transfer') }}
            />
        </SpeedDial>
    </Portal>
}
