import { faCheck, faFilter } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useMemo, useState } from 'react'
import { match, P } from 'ts-pattern'

import { Watch } from '../../../engine/model'
import { deepEqual } from '../../helpers/deepEqual'
import { showIf } from '../../helpers/smallTools'
import { useEngine } from '../../useEngine'
import { GoalInput } from '../../widgets/expenses/editors/GoalInput'
import { FilterEditor } from '../../widgets/FilterEditor'
import { ActionFab } from '../../widgets/generic/ActionButton'
import { Column } from '../../widgets/generic/Containers'

interface Props {
    goal: Watch
    onChange: (goal: Watch) => void
}

export function ExpensesGoalEditor({ goal, onChange }: Props): ReactElement {
    const engine = useEngine()
    const [editFilter, setEditFilter] = useState(false)
    const [newGoal, setNewGoal] = useState(goal)

    const newNameTrimmed = newGoal.name.trim()

    const nameCollision = goal.name !== newNameTrimmed
        && engine.hasWatchWithName(newNameTrimmed)

    const onSave = useMemo(
        () => {
            if (
                goal === null
                || newGoal === null
                || deepEqual(goal, newGoal)
                || newNameTrimmed === ''
                || newGoal.perDayAmount === 0
                || nameCollision
            ) {
                return null
            }

            return () => {
                const g = { ...newGoal, name: newNameTrimmed, lastModified: DateTime.utc() }
                engine.pushWatch(g)
                onChange(g)
                setNewGoal(g)
            }
        },
        [
            goal,
            newGoal,
            newNameTrimmed,
            nameCollision
        ]
    )

    return (
        <Column mt={1} gap={1}>
            <TextField
                label={'Name'}
                variant={'filled'}
                size={'small'}
                value={newGoal.name}
                error={newNameTrimmed === '' || nameCollision}
                helperText={
                match([newNameTrimmed, nameCollision])
                    .with(['', P._], () => 'Empty')
                    .with([P._, true], () => 'Already exists')
                    .otherwise(() => 'ok')
            }
                onChange={(ev) => {
                    setNewGoal({ ...newGoal, name: ev.target.value })
                }}
            />
            <Button
                fullWidth
                variant={'contained'}
                onClick={() => { setEditFilter(true) }}
                sx={{ gap: 1 }}
            >
                <FontAwesomeIcon icon={faFilter} />
                {'Filter'}
            </Button>
            <GoalInput
                currency={newGoal.currency}
                onCurrencyChange={(currency) => {
                    setNewGoal({ ...newGoal, currency })
                }}
                perDayAmount={newGoal.perDayAmount}
                onPerDayAmountChange={(perDayAmount) => {
                    setNewGoal({ ...newGoal, perDayAmount })
                }}
            />
            <ActionFab
                action={onSave}
                bottom={goal.name === '' ? '20px' : undefined}
            >
                <FontAwesomeIcon icon={faCheck} />
            </ActionFab>
            {
                showIf(editFilter,
                    <FilterEditor
                        filter={newGoal.filter}
                        onClose={() => { setEditFilter(false) }}
                        onFilterChanged={(f) => { setNewGoal({ ...newGoal, filter: f }) }}
                    />
                )
            }
        </Column>
    )
}
