import { faCheck, faFilter } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, FormControlLabel, Switch, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { match, P } from 'ts-pattern'

import { deepEqual } from '../../../helpers/deepEqual'
import { run, showIf } from '../../../helpers/smallTools'
import { GoalsModel } from '../../../model/goals'
import { type ExpensesGoal } from '../../../model/model'
import { FilterEditor } from '../../FilterEditor'
import { ActionFab } from '../../generic/ActionButton'
import { Column } from '../../generic/Containers'
import { GoalInput } from './GoalInput'

interface Props {
    goal: ExpensesGoal
    onChange: (goal: ExpensesGoal) => void
}

export function ExpensesGoalEditor ({ goal, onChange }: Props): ReactElement {
    const [editFilter, setEditFilter] = useState(false)
    const [newGoal, setNewGoal] = useState(goal)
    const navigate = useNavigate()

    const goalsModel = GoalsModel.instance()

    const newNameTrimmed = newGoal.name.trim()

    const nameCollision = run(() => {
        if (goal.name === newNameTrimmed || goalsModel.goals === null) return false

        const g = goalsModel.goals.find(g => g.name === newNameTrimmed)
        return g !== undefined && g.deleted !== true
    })

    const onSave = useMemo(
        () => {
            if (
                goal === null ||
                newGoal === null ||
                deepEqual(goal, newGoal) ||
                newNameTrimmed === '' ||
                newGoal.perDayAmount === 0 ||
                nameCollision
            ) {
                return null
            }

            return async () => {
                const g = { ...newGoal, name: newNameTrimmed, lastModified: DateTime.utc() }
                await goalsModel.put(g)
                if (goal.name !== g.name) {
                    await goalsModel.put({ ...goal, deleted: true })
                    navigate(`/goals/${encodeURIComponent(g.name)}`)
                } else {
                    onChange(g)
                }
            }
        },
        [
            goal,
            newGoal,
            newNameTrimmed,
            nameCollision
        ]
    )

    return <Column mt={1} gap={1}>
        <TextField
            label={'Name'}
            variant={'filled'}
            size={'small'}
            value={newGoal.name}
            error={newNameTrimmed === '' || nameCollision }
            helperText={
                match([newNameTrimmed, nameCollision])
                    .with(['', P._], () => 'Empty')
                    .with([P._, true], () => 'Already exists')
                    .otherwise(() => 'ok')
            }
            onChange={ev => {
                setNewGoal({ ...newGoal, name: ev.target.value })
            }}
        />
        <Button
            fullWidth
            variant={'contained'}
            onClick={() => { setEditFilter(true) }}
            sx={{ gap: 1 }}
        ><FontAwesomeIcon icon={faFilter}/>{'Filter'}</Button>
        <FormControlLabel
            label={'Regular expenses'}
            control={<Switch
                checked={newGoal.isRegular}
                onChange={(_, v) => { setNewGoal({ ...newGoal, isRegular: v }) }}
            />}
            sx={{ mb: 2 }}
        />
        <GoalInput
            currency={newGoal.currency}
            onCurrencyChange={currency => {
                setNewGoal({ ...newGoal, currency })
            }}
            perDayAmount={newGoal.perDayAmount}
            onPerDayAmountChange={perDayAmount => {
                setNewGoal({ ...newGoal, perDayAmount })
            }}
        />
        <ActionFab
            action={onSave}
            bottom={goal.name === '' ? '20px' : undefined}
        >
            <FontAwesomeIcon icon={faCheck}/>
        </ActionFab>
        {
            showIf(editFilter, <FilterEditor
                filter={newGoal.filter}
                onClose={() => { setEditFilter(false) }}
                onFilterChanged={f => { onChange({ ...newGoal, filter: f }) }}
            />)
        }
    </Column>
}
