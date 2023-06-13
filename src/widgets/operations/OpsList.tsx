import React, { useState, useEffect, type ReactElement } from 'react'
import { type Operations } from '../../model/stats'
import { type NotDeletedOperation } from '../../model/model'
import { Box, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { AppState } from '../../model/appState'
import { OperationsModel } from '../../model/operations'
import { AdjustmentCard } from './cards/AdjustmentCard'
import { TransferCard } from './cards/TransferCard'
import { IncomeCard } from './cards/IncomeCard'
import { ExpenseCard } from './cards/ExpenseCard'

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
