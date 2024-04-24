import { Box, Skeleton, Stack, Typography, useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { formatCurrency } from '../../helpers/currencies'
import { HumanTimeSpan } from '../../helpers/dates'
import { runAsync } from '../../helpers/smallTools'
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
    predicate?: Predicate
    timeSpan?: HumanTimeSpan
}

export const OpsList = observer(function OpsList(props: Props): ReactElement {
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
                if (operationsModel.operations === null) {
                    return
                }

                const appState = AppState.instance()
                const predicate = props.predicate ?? PE.filter(appState.filter)
                const timeSpan = props.timeSpan ?? appState.timeSpan
                const stats = await calcStats(predicate, timeSpan, appState.today, {
                    opsByDate: opsPerIterval('day', false),
                    perDayExpenses: perIntervalExpensesReducer('day', PE.any(), masterCurrency)
                })
                setDisplayOps(stats.opsByDate.reverse())
                setPerDayExpenses(stats.perDayExpenses.slice(0, stats.opsByDate.length).reverse())
            })
        },
        [
            props.predicate,
            props.timeSpan,
            operationsModel.operations,
            appState.filter,
            appState.timeSpanInfo,
            appState.masterCurrency
        ]
    )

    if (displayOps === null) {
        return (
            <Box height={'100%'} overflow={'hidden'}>
                <DivBody2 pt={2}>
                    <Skeleton width={80} sx={{ maxWidth: '100%' }} />
                </DivBody2>
                <Column gap={1}>
                    <OpCardSkeleton />
                    <OpCardSkeleton />
                    <OpCardSkeleton />
                </Column>
            </Box>
        )
    }

    return (
        <Box height={'100%'}>
            {displayOps.slice(0, displayDays).map((group, i) => (
                <Box key={group[0].date.toISODate()}>
                    <Stack direction={'row'} spacing={1} justifyContent={'space-between'} pt={3} pb={1} px={1}>
                        <DivBody2 fontWeight={'bold'}>
                            {group[0].date.toLocaleString({ dateStyle: 'full' })}
                        </DivBody2>
                        {
                        perDayExpenses !== null
                        && (
                            <DivBody2
                                color={`${perDayExpenses[i] < 0 ? 'error' : 'success'}.${conrastColor}`}
                                fontWeight={'bold'}
                            >
                                {formatCurrency(Math.abs(perDayExpenses[i]), masterCurrency)}
                            </DivBody2>
                        )
                    }
                    </Stack>
                    <Column gap={1}>
                        {group.map(op => (
                            <a
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
                            </a>
                        ))}
                    </Column>
                </Box>
            )
            )}
            {displayOps !== null && displayDays < displayOps.length
                ? (
                    <Typography color={'text.primary'} textAlign={'center'} mt={2}>
                        <a onClick={() => {
                            setDisplayDays(Math.min(displayOps.length, displayDays + 10))
                        }}
                        >
                            {'Show more'}
                        </a>
                    </Typography>
                    )
                : null}
            <Box minHeight={144} />
        </Box>
    )
})

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
