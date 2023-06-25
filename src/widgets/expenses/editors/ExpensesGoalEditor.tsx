import React, { useState, type ReactElement } from 'react'
import { Button, FormControlLabel, IconButton, Switch, TextField } from '@mui/material'
import { GoalsModel } from '../../../model/goals'
import { FilterEditor } from '../../FilterEditor'
import { CurrencyInput } from '../../CurrencyInput'
import { Column, Row } from '../../Containers'
import { run, showIf } from '../../../helpers/smallTools'
import { CurrencySelector } from '../../CurrencySelector'
import { getCurrencySymbol } from '../../../helpers/currencies'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter } from '@fortawesome/free-solid-svg-icons'
import { type ExpensesGoal } from '../../../model/model'
import { P, match } from 'ts-pattern'

interface Props {
    origName: string
    goal: ExpensesGoal
    onChange: (goal: ExpensesGoal) => void
}

export function ExpensesGoalEditor ({ origName, goal, onChange }: Props): ReactElement {
    const [editFilter, setEditFilter] = useState(false)
    const [currencySelector, setCurrecySelector] = useState(false)

    const goalsModel = GoalsModel.instance()

    const trimmedName = goal.name.trim()

    const nameCollision = run(() => {
        if (origName === trimmedName || goalsModel.goals === null) return false

        const g = goalsModel.goals.find(g => g.name === trimmedName)
        return g !== undefined && g.deleted !== true
    })

    return <Column mt={1} gap={1}>
        <TextField
            label="Name"
            variant="filled"
            size="small"
            value={goal.name}
            error={goal.name.trim() === '' || nameCollision }
            helperText={
                match([trimmedName, nameCollision])
                    .with(['', P._], () => 'Empty')
                    .with([P._, true], () => 'Already exists')
                    .otherwise(() => 'ok')
            }
            onChange={ev => {
                onChange({ ...goal, name: ev.target.value })
            }}
        />
        <Button
            fullWidth
            variant='contained'
            onClick={() => { setEditFilter(true) }}
            sx={{ gap: 1 }}
        ><FontAwesomeIcon icon={faFilter}/>Filter</Button>
        <Row gap={1}>
            <IconButton
                color='primary'
                sx={{ width: 48 }}
                onClick={() => { setCurrecySelector(true) }}
            >
                {getCurrencySymbol(goal.currency)}
            </IconButton>
            <CurrencyInput
                label='Per day amount'
                negative={false}
                amount={goal.perDayAmount}
                currency={goal.currency}
                onAmountChange={amount => { onChange({ ...goal, perDayAmount: amount }) }}
            />
        </Row>
        <FormControlLabel
            label="Regular expenses"
            control={<Switch
                checked={goal.isRegular}
                onChange={(_, v) => { onChange({ ...goal, isRegular: v }) }}
            />}
        />
        {
            showIf(editFilter, <FilterEditor
                filter={goal.filter}
                onClose={() => { setEditFilter(false) }}
                onFilterChanged={f => { onChange({ ...goal, filter: f }) }}
            />)
        }
        {
            showIf(currencySelector, <CurrencySelector
                currency={goal.currency}
                onClose={() => { setCurrecySelector(false) }}
                onCurrencySelected={c => { onChange({ ...goal, currency: c }) }}
            />)
        }
    </Column>
}
