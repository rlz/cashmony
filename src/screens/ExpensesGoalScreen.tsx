import { observer } from 'mobx-react-lite'
import React, { useState, useEffect, type ReactElement } from 'react'
import { Box, Button, Tab, Tabs, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { type ExpensesGoal } from '../model/model'
import { deepEqual } from '../helpers/deepEqual'
import { DateTime } from 'luxon'
import { ExpensesStats, Operations } from '../model/stats'
import { formatCurrency } from '../helpers/currencies'
import { OpsList } from '../widgets/operations/OpsList'
import { AppState } from '../model/appState'
import { nonNull, run, runAsync } from '../helpers/smallTools'
import { match } from 'ts-pattern'
import { CurrenciesModel } from '../model/currencies'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { ExpensesGroupScreenSkeleton } from '../widgets/expenses/ExpensesGroupScreenSkeleton'
import { GoalsModel } from '../model/goals'
import { ExpensesStatsWidget } from '../widgets/expenses/ExpensesStatsWidget'
import { ExpensesGoalEditor } from '../widgets/expenses/editors/ExpensesGoalEditor'

export const ExpensesGoalScreen = observer((): ReactElement => {
    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    const goalsModel = GoalsModel.instance()

    const goalName = nonNull(useParams().goalName, 'goalName expected here')

    const navigate = useNavigate()
    const [goal, setGoal] = useState<ExpensesGoal | null>(null)
    const [newGoal, setNewGoal] = useState<ExpensesGoal | null>(null)
    const [tab, setTab] = useState(0)

    useEffect(
        () => {
            if (goalsModel.goals === null) {
                return
            }

            const g = goalsModel.get(goalName)
            setGoal(g)
            setNewGoal(g)
        },
        [
            goalsModel.goals
        ]
    )

    const newGoalNameTrimmed = newGoal?.name.trim()

    if (
        goal === null ||
        newGoal === null ||
        newGoalNameTrimmed === undefined ||
        currenciesModel.rates === null
    ) {
        return <ExpensesGroupScreenSkeleton />
    }

    const nameCollision = run(() => {
        if (newGoal.name === goal.name) return false

        const collision = goalsModel.get(newGoalNameTrimmed)
        return collision !== null && collision.deleted !== true
    })

    const stats = new ExpensesStats(
        Operations.forFilter(newGoal.filter).keepTypes('expense', 'income'),
        { value: -newGoal.perDayAmount, currency: newGoal.currency }
    )

    const cur = (amount: number, compact = false): string => formatCurrency(amount, newGoal.currency, compact)

    const onSave = run(() => {
        if (
            deepEqual(goal, newGoal) ||
            newGoalNameTrimmed === '' ||
            nameCollision
        ) {
            return null
        }

        return async () => {
            const g = { ...newGoal, name: newGoalNameTrimmed, lastModified: DateTime.utc() }
            await goalsModel.put(g)
            if (goal.name !== g.name) {
                await goalsModel.put({ ...goal, deleted: true })
                navigate(`/goals/${encodeURIComponent(g.name)}`)
            } else {
                setGoal(g)
            }
        }
    })

    const goal30 = stats.goal(30)

    return <MainScreen
        navigateOnBack='/goals'
        title='Expenses goal'
        onSave={onSave}
    >
        <Box p={1}>
            <Typography variant='h6' textAlign='center' mt={1}>
                {newGoal.name.trim() === '' ? '-' : newGoal.name}
            </Typography>
            <Typography variant='h6' textAlign='center' color='primary.main' mb={1}>
                {cur(-stats.amountTotal(appState.timeSpan, newGoal.currency))}
            </Typography>
            <Typography variant='body2' textAlign='center'>
            Goal (30d): {goal30 !== null ? cur(-goal30.value) : '-'}
            </Typography>
            <Tabs value={tab} onChange={(_, tab) => { setTab(tab) }} variant='fullWidth'>
                <Tab label='Stats'/>
                <Tab label='Modify'/>
                <Tab label='Operations'/>
            </Tabs>
        </Box>
        <Box overflow='scroll'>
            <Box px={1}>
                {
                    match(tab)
                        .with(0, () => <ExpensesStatsWidget currency={newGoal.currency} stats={stats} />)
                        .with(1, () => {
                            return <>
                                <ExpensesGoalEditor origName={goal.name} goal={newGoal} onChange={setNewGoal} />
                                <Button
                                    variant='contained'
                                    fullWidth
                                    color='error'
                                    sx={{ mt: 5 }}
                                    onClick={() => {
                                        runAsync(async () => {
                                            await goalsModel.put({ ...goal, deleted: true })
                                            navigate('/goals')
                                        })
                                    }}
                                >
                                Delete
                                </Button>
                            </>
                        })
                        .with(2, () => <OpsList
                            operations={stats.operations.forTimeSpan(appState.timeSpan)}
                        />)
                        .otherwise(() => { throw Error('Unimplenented tab') })
                }
                <Box minHeight={72}/>
            </Box>
        </Box>
    </MainScreen>
})
