import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement } from 'react'
import { Box, Fab } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { match } from 'ts-pattern'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { ExpensesList } from '../widgets/expenses/ExpensesList'
import { GoalsModel } from '../model/goals'
import { AddExpensesGoalModal } from '../widgets/expenses/editors/AddExpensesGoalModal'
import { Column } from '../widgets/Containers'
import { ExpensesCardSkeleton } from '../widgets/expenses/ExpensesCard'

export const ExpensesGoalsScreen = observer((): ReactElement => {
    const goalsModel = GoalsModel.instance()

    const [add, setAdd] = useState(false)

    if (goalsModel.goals === null) {
        return <GoalsScreenSkeleton />
    }

    return <MainScreen>
        {
            match(add)
                .with(
                    true, () => <AddExpensesGoalModal
                        onClose={() => { setAdd(false) }}
                    />
                )
                .otherwise(
                    () => <Fab
                        color="primary"
                        sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                        onClick={() => { setAdd(true) }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </Fab>
                )
        }
        <ExpensesList items={goalsModel.goals.filter(i => i.deleted !== true)}/>
        <Box minHeight={144}/>
    </MainScreen>
})

function GoalsScreenSkeleton (): ReactElement {
    return <MainScreen>
        <Column gap={1}>
            <ExpensesCardSkeleton />
            <ExpensesCardSkeleton />
            <ExpensesCardSkeleton />
        </Column>
    </MainScreen>
}
