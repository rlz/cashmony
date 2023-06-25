import React, { useState, type ReactElement } from 'react'
import { FullScreenModal } from '../../FullScreenModal'
import { Button } from '@mui/material'
import { DateTime } from 'luxon'
import { GoalsModel } from '../../../model/goals'
import { DEFAULT_FILTER } from '../../../model/filter'
import { CurrenciesModel } from '../../../model/currencies'
import { run } from '../../../helpers/smallTools'
import { ExpensesGoalEditor } from './ExpensesGoalEditor'
import { observer } from 'mobx-react-lite'

export const AddExpensesGoalModal = observer(({ onClose }: { onClose: () => void }): ReactElement => {
    const currenciesModel = CurrenciesModel.instance()

    const [goal, setGoal] = useState({
        name: '',
        lastModified: DateTime.utc(),
        filter: DEFAULT_FILTER,
        perDayAmount: 0,
        currency: currenciesModel.currencies[0],
        regularExpenses: false
    })

    const goalsModel = GoalsModel.instance()

    const trimmedName = goal.name.trim()

    const save = async (): Promise<void> => {
        await goalsModel.put({
            ...goal,
            name: trimmedName,
            lastModified: DateTime.utc()
        })
        onClose()
    }

    const exists = run(() => {
        if (goalsModel.goals === null) {
            return false
        }

        const g = goalsModel.goals.find(g => g.name === trimmedName)
        return g !== undefined && g.deleted !== true
    })

    return <>
        <FullScreenModal title="Add expenses goal" onClose={onClose} gap={1}>
            <ExpensesGoalEditor origName='' goal={goal} onChange={setGoal} />
            <Button
                fullWidth
                variant="contained"
                disabled={ trimmedName === '' || goal.perDayAmount === 0 || exists }
                onClick={() => { void save() }}
            >Create</Button>
        </FullScreenModal>
    </>
})
