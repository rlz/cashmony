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
import { nonNull, run, runAsync, showIfLazy } from '../helpers/smallTools'
import { match } from 'ts-pattern'
import { CurrenciesModel } from '../model/currencies'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { ExpensesGroupScreenSkeleton } from '../widgets/expenses/ExpensesGroupScreenSkeleton'
import { GoalsModel } from '../model/goals'
import { ExpensesStatsWidget } from '../widgets/expenses/ExpensesStatsWidget'
import { ExpensesGoalEditor } from '../widgets/expenses/editors/ExpensesGoalEditor'
import { useWidth, widthOneOf } from '../helpers/useWidth'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { ExpensesGoalsScreenBody } from './ExpensesGoalsScreen'
import { ResizeHandle } from '../widgets/generic/resizeHandle'
import { Column } from '../widgets/Containers'
import { FullScreenModal } from '../widgets/FullScreenModal'
import { OperationScreenBody } from './OperationScreen'

type OnSaveType = (() => void) | null | undefined

export function ExpensesGoalScreen (): ReactElement {
    const bigScreen = !widthOneOf(useWidth(), ['xs', 'sm'])
    const [onSave, setOnSave] = useState<OnSaveType>(null)

    return <MainScreen
        navigateOnBack='/goals'
        title='Expenses goal'
        onSave={onSave}
    >
        {
            bigScreen
                ? <PanelGroup direction='horizontal'>
                    <Panel>
                        <ExpensesGoalsScreenBody />
                    </Panel>
                    <ResizeHandle />
                    <Panel>
                        <ExpensesGoalScreenBody setOnSave={(onSave: OnSaveType) => { setOnSave((): OnSaveType => onSave) }}/>
                    </Panel>
                </PanelGroup>
                : <ExpensesGoalScreenBody setOnSave={(onSave: OnSaveType) => { setOnSave((): OnSaveType => onSave) }}/>
        }
    </MainScreen>
}

interface Props {
    setOnSave: (onSave: OnSaveType) => void
}

export const ExpensesGoalScreenBody = observer((props: Props): ReactElement => {
    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    const goalsModel = GoalsModel.instance()

    const [goalName, tabName, opId] = run(() => {
        const params = useParams()
        const goalName = nonNull(params.goalName, 'catName expected here')
        const opId = params.opId
        if (opId !== undefined) {
            return [goalName, 'operations', opId]
        }

        const tabName = params.tabName ?? 'stats'
        return [goalName, tabName, null]
    })

    const navigate = useNavigate()
    const [goal, setGoal] = useState<ExpensesGoal | null>(null)
    const [newGoal, setNewGoal] = useState<ExpensesGoal | null>(null)
    const [opModalTitle, setOpModalTitle] = useState('')
    const [opModalOnSave, setOpModalOnSave] = useState<(() => Promise<void>) | null | undefined>(null)

    const newGoalNameTrimmed = newGoal?.name.trim()

    const nameCollision = run(() => {
        if (
            goal === null ||
            newGoal === null ||
            newGoalNameTrimmed === undefined ||
            newGoal.name === goal.name
        ) {
            return false
        }

        const collision = goalsModel.get(newGoalNameTrimmed)
        return collision !== null && collision.deleted !== true
    })

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
            goalsModel.goals,
            goalName
        ]
    )

    useEffect(
        () => {
            if (
                goal === null ||
                newGoal === null ||
                newGoalNameTrimmed === undefined
            ) {
                return
            }

            if (
                deepEqual(goal, newGoal) ||
                newGoalNameTrimmed === '' ||
                nameCollision
            ) {
                props.setOnSave(null)
                return
            }

            props.setOnSave(() => {
                runAsync(async () => {
                    const g = { ...newGoal, name: newGoalNameTrimmed, lastModified: DateTime.utc() }
                    await goalsModel.put(g)
                    if (goal.name !== g.name) {
                        await goalsModel.put({ ...goal, deleted: true })
                        navigate(`/goals/${encodeURIComponent(g.name)}`)
                    } else {
                        setGoal(g)
                    }
                })
            })
        },
        [
            goal,
            newGoal,
            newGoalNameTrimmed,
            nameCollision
        ]
    )

    if (
        goal === null ||
        newGoal === null ||
        newGoalNameTrimmed === undefined ||
        currenciesModel.rates === null
    ) {
        return <ExpensesGroupScreenSkeleton />
    }

    const stats = new ExpensesStats(
        Operations.forFilter(newGoal.filter).keepTypes('expense', 'income'),
        { value: -newGoal.perDayAmount, currency: newGoal.currency }
    )

    const cur = (amount: number, compact = false): string => formatCurrency(amount, newGoal.currency, compact)

    const goal30 = stats.goal(30)

    return <>
        <Column height='100%'>
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
                <Tabs value={tabName} onChange={(_, tab) => { navigate(`/goals/${encodeURIComponent(goal.name)}/${tab as string}`) }} variant='fullWidth'>
                    <Tab value='stats' label='Stats'/>
                    <Tab value='modify' label='Modify'/>
                    <Tab value='operations' label='Operations'/>
                </Tabs>
            </Box>
            <Box overflow='scroll' flex='1 1 auto'>
                <Box px={1}>
                    {
                        match(tabName)
                            .with('stats', () => <ExpensesStatsWidget currency={newGoal.currency} stats={stats} />)
                            .with('modify', () => {
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
                            .with('operations', () => <OpsList
                                noFab
                                onOpClick={(opId) => {
                                    navigate(`/goals/${goalName}/operations/${opId}`)
                                }}
                                operations={stats.operations.forTimeSpan(appState.timeSpan)}
                            />)
                            .otherwise(() => { throw Error('Unimplenented tab') })
                    }
                    <Box minHeight={72}/>
                </Box>
            </Box>
        </Column>
        {
            showIfLazy(opId !== null, () => {
                return <FullScreenModal
                    title={opModalTitle}
                    onClose={() => { navigate(`/goals/${goalName}/operations`) }}
                    onSave={opModalOnSave}
                >
                    <Box p={1}>
                        <OperationScreenBody
                            opId={opId ?? ''}
                            setTitle={setOpModalTitle}
                            setOnSave={(onSave) => {
                                if (onSave === null || onSave === undefined) {
                                    setOpModalOnSave(onSave)
                                    return
                                }

                                setOpModalOnSave(() => {
                                    return onSave
                                })
                            }}
                        />
                    </Box>
                </FullScreenModal>
            })
        }
    </>
})
