import React, { useState, useEffect, type ReactElement, useMemo } from 'react'
import { Operations } from '../../model/stats'
import { type NotDeletedOperation } from '../../model/model'
import { Backdrop, Box, SpeedDial, SpeedDialAction, SpeedDialIcon, type SxProps, Typography, Portal } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { AppState } from '../../model/appState'
import { OperationsModel } from '../../model/operations'
import { AdjustmentCard } from './cards/AdjustmentCard'
import { TransferCard } from './cards/TransferCard'
import { IncomeCard } from './cards/IncomeCard'
import { ExpenseCard } from './cards/ExpenseCard'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCreditCard, faHandHoldingDollar, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { run, showIf } from '../../helpers/smallTools'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()

interface Props {
    noFab?: boolean
    operations?: Operations
    sx?: SxProps
}

export const OpsList = observer((props: Props): ReactElement => {
    const displayOps = useMemo(
        () => {
            const operations = props.operations ?? run(() => {
                const appState = AppState.instance()
                return Operations.forFilter(appState.filter).forTimeSpan(appState.timeSpan)
            })
            return [...operations.groupByDate({ reverse: true })]
        },
        [props.operations, operationsModel.operations]
    )

    const [displayDays, setDisplayDays] = useState(Math.min(displayOps.length, 30))

    useEffect(() => {
        setDisplayDays(Math.min(displayOps.length, 30))
    }, [appState.timeSpanInfo, operationsModel.operations])

    return <Box sx={props.sx}>
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
                onClick={() => { navigate('/new-op/expense') }}
            />
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faHandHoldingDollar} />}
                tooltipOpen
                tooltipTitle="Income"
                FabProps={{ color: 'success', size: 'medium' }}
                onClick={() => { navigate('/new-op/income') }}
            />
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faMoneyBillTransfer} />}
                tooltipOpen
                tooltipTitle="Transfer"
                FabProps={{ color: 'info', size: 'medium' }}
                onClick={() => { navigate('/new-op/transfer') }}
            />
        </SpeedDial>
    </Portal>
}
