import { faCreditCard, faHandHoldingDollar, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Backdrop, Box, Portal, Skeleton, SpeedDial, SpeedDialAction, SpeedDialIcon, type SxProps, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { runAsync, showIf } from '../../helpers/smallTools'
import { AppState } from '../../model/appState'
import { type NotDeletedOperation } from '../../model/model'
import { OperationsModel } from '../../model/operations'
import { PE, type Predicate } from '../../model/predicateExpression'
import { calcStats } from '../../model/stats'
import { opsPerIterval } from '../../model/statsReducers'
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
    sx?: SxProps
}

export const OpsList = observer((props: Props): ReactElement => {
    const navigate = useNavigate()
    const [displayOps, setDisplayOps] = useState<NotDeletedOperation[][] | null>(null)
    const [displayDays, setDisplayDays] = useState(30)

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
                    const appState = AppState.instance()
                    const predicate = props.predicate ?? PE.filter(appState.filter)
                    const stats = await calcStats(predicate, appState.timeSpan, appState.today, {
                        opsByDate: opsPerIterval('day', false)
                    })
                    setDisplayOps(stats.opsByDate.reverse())
                    return
                }
                setDisplayOps(props.operations)
            })
        },
        [props.operations, props.predicate, operationsModel.operations, appState.filter, appState.timeSpan]
    )

    if (displayOps === null) {
        return <Box sx={props.sx}>
            <DivBody2 pt={2}>
                <Skeleton width={80} sx={{ maxWidth: '100%' }}/>
            </DivBody2>
            <Column gap={1}>
                <OpCardSkeleton />
                <OpCardSkeleton />
                <OpCardSkeleton />
            </Column>
        </Box>
    }

    return <Box sx={props.sx}>
        {displayOps.slice(0, displayDays).map(group =>
            <Box key={group[0].date.toISODate()}>
                <DivBody2 pt={2}>
                    {group[0].date.toLocaleString({ dateStyle: 'full' })}
                </DivBody2>
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
                        <Transaction op={op}/>
                    </a>)}
                </Column>
            </Box>
        )}
        {displayOps !== null && displayDays < displayOps.length
            ? <Typography color={'text.primary'} textAlign={'center'} mt={2}>
                <a onClick={() => {
                    setDisplayDays(Math.min(displayOps.length, displayDays + 10))
                }}>{'Show more'}</a>
            </Typography>
            : null
        }
        <Box minHeight={144}/>
        {
            showIf(props.noFab !== true, <Fab />)
        }
    </Box>
})
OpsList.displayName = 'OpsList'

const Transaction = ({ op }: { op: NotDeletedOperation }): ReactElement => {
    if (op.type === 'adjustment') {
        return <AdjustmentCard operation={op}/>
    }

    if (op.type === 'transfer') {
        return <TransferCard operation={op}/>
    }

    if (op.type === 'income') {
        return <IncomeCard operation={op}/>
    }

    return <ExpenseCard operation={op}/>
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
                icon={<FontAwesomeIcon icon={faCreditCard}/>}
                tooltipOpen
                tooltipTitle={'Expence'}
                FabProps={{ color: 'error', size: 'medium' }}
                onClick={() => { navigate('/new-op/expense') }}
            />
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faHandHoldingDollar} />}
                tooltipOpen
                tooltipTitle={'Income'}
                FabProps={{ color: 'success', size: 'medium' }}
                onClick={() => { navigate('/new-op/income') }}
            />
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faMoneyBillTransfer} />}
                tooltipOpen
                tooltipTitle={'Transfer'}
                FabProps={{ color: 'info', size: 'medium' }}
                onClick={() => { navigate('/new-op/transfer') }}
            />
        </SpeedDial>
    </Portal>
}
