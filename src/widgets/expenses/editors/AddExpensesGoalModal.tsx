import { Button } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useState } from 'react'

import { run } from '../../../helpers/smallTools'
import { CurrenciesModel } from '../../../model/currencies'
import { DEFAULT_FILTER } from '../../../model/filter'
import { GoalsModel } from '../../../model/goals'
import { type ExpensesGoal } from '../../../model/model'
import { FullScreenModal } from '../../FullScreenModal'
import { Column } from '../../generic/Containers'
import { ExpensesGoalEditor } from './ExpensesGoalEditor'

export const AddExpensesGoalModal = observer(({ onClose }: { onClose: () => void }): ReactElement => {
    const currenciesModel = CurrenciesModel.instance()

    const [goal, setGoal] = useState<ExpensesGoal>({
        name: '',
        lastModified: DateTime.utc(),
        filter: DEFAULT_FILTER,
        perDayAmount: 0,
        currency: currenciesModel.currencies[0],
        isRegular: false
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
        <FullScreenModal title='Add expenses goal' onClose={onClose}>
            <Column gap={1} p={1}>
                <ExpensesGoalEditor origName='' goal={goal} onChange={setGoal} />
                <Button
                    fullWidth
                    variant='contained'
                    disabled={ trimmedName === '' || goal.perDayAmount === 0 || exists }
                    onClick={() => { void save() }}
                >Create</Button>
            </Column>
        </FullScreenModal>
    </>
})
