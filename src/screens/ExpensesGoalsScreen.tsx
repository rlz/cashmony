import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Fab } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useState } from 'react'
import { match } from 'ts-pattern'

import { GoalsModel } from '../model/goals'
import { Column } from '../widgets/Containers'
import { AddExpensesGoalModal } from '../widgets/expenses/editors/AddExpensesGoalModal'
import { ExpensesCardSkeleton } from '../widgets/expenses/ExpensesCard'
import { ExpensesList } from '../widgets/expenses/ExpensesList'
import { MainScreen } from '../widgets/mainScreen/MainScreen'

export function ExpensesGoalsScreen (): ReactElement {
    return <MainScreen>
        <ExpensesGoalsScreenBody />
    </MainScreen>
}

export const ExpensesGoalsScreenBody = observer((): ReactElement => {
    const goalsModel = GoalsModel.instance()

    const [add, setAdd] = useState(false)

    if (goalsModel.goals === null) {
        return <GoalsScreenSkeleton />
    }

    return <>
        {
            match(add)
                .with(
                    true, () => <AddExpensesGoalModal
                        onClose={() => { setAdd(false) }}
                    />
                )
                .otherwise(
                    () => <Fab
                        color='primary'
                        sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                        onClick={() => { setAdd(true) }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </Fab>
                )
        }
        <Box p={1}>
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
