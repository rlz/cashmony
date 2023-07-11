import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Fab } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'

import { AppState } from '../model/appState'
import { GoalsModel } from '../model/goals'
import { AddExpensesGoalModal } from '../widgets/expenses/editors/AddExpensesGoalModal'
import { ExpensesCardSkeleton } from '../widgets/expenses/ExpensesCard'
import { ExpensesList } from '../widgets/expenses/ExpensesList'
import { Column } from '../widgets/generic/Containers'
import { MainScreen } from '../widgets/mainScreen/MainScreen'

export function ExpensesGoalsScreen (): ReactElement {
    const appState = AppState.instance()

    useEffect(() => {
        appState.setSubTitle('Goals')
        appState.setOnClose(null)
    }, [])

    return <MainScreen>
        <ExpensesGoalsScreenBody />
    </MainScreen>
}

interface ExpensesGoalsScreenBodyProps {
    noFab?: boolean
}

export const ExpensesGoalsScreenBody = observer(({ noFab }: ExpensesGoalsScreenBodyProps): ReactElement => {
    const goalsModel = GoalsModel.instance()

    const [add, setAdd] = useState(false)

    if (goalsModel.goals === null) {
        return <GoalsScreenSkeleton />
    }

    return <>
        {
            add
                ? <AddExpensesGoalModal
                    onClose={() => { setAdd(false) }}
                />
                : undefined
        }
        {
            add || noFab === true
                ? undefined
                : <Fab
                    color='primary'
                    sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                    onClick={() => { setAdd(true) }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                </Fab>
        }
        <Box p={1} height={'100%'} overflow={'auto'}>
            <Box maxWidth={900} mx='auto'>
                <ExpensesList items={goalsModel.goals.filter(i => i.deleted !== true)}/>
                <Box minHeight={144}/>
            </Box>
        </Box>
    </>
})

function GoalsScreenSkeleton (): ReactElement {
    return <Column gap={1} p={1}>
        <ExpensesCardSkeleton />
        <ExpensesCardSkeleton />
        <ExpensesCardSkeleton />
    </Column>
}
