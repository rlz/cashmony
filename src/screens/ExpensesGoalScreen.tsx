import { Box, Button, Tab, Tabs, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { formatCurrency } from '../helpers/currencies'
import { nonNull, run, runAsync, showIfLazy } from '../helpers/smallTools'
import { screenWidthIs } from '../helpers/useWidth'
import { AppState } from '../model/appState'
import { GoalsModel } from '../model/goals'
import { type ExpensesGoal } from '../model/model'
import { OperationsModel } from '../model/operations'
import { EXPENSE_PREDICATE, PE } from '../model/predicateExpression'
import { calcStats } from '../model/stats'
import { periodExpensesReducer } from '../model/statsReducers'
import { ExpensesGoalEditor } from '../widgets/expenses/editors/ExpensesGoalEditor'
import { ExpensesGroupScreenSkeleton } from '../widgets/expenses/ExpensesGroupScreenSkeleton'
import { ExpensesStatsWidget } from '../widgets/expenses/ExpensesStatsWidget'
import { FullScreenModal } from '../widgets/FullScreenModal'
import { Column } from '../widgets/generic/Containers'
import { ResizeHandle } from '../widgets/generic/resizeHandle'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'
import { ExpensesGoalsScreenBody } from './ExpensesGoalsScreen'
import { OperationScreenBody } from './OperationScreen'

export function ExpensesGoalScreen (): ReactElement {
    const appState = AppState.instance()
    const smallScreen = screenWidthIs('xs', 'sm')
    const navigate = useNavigate()

    useEffect(() => {
        appState.setOnClose(() => {
            navigate('/goals')
        })
    }, [])

    return <MainScreen>
        {
            smallScreen
                ? <ExpensesGoalScreenBody/>
                : <PanelGroup direction={'horizontal'}>
                    <Panel>
                        <ExpensesGoalsScreenBody noFab />
                    </Panel>
                    <ResizeHandle />
                    <Panel>
                        <ExpensesGoalScreenBody/>
                    </Panel>
                </PanelGroup>
        }
    </MainScreen>
}

export const ExpensesGoalScreenBody = observer(function ExpensesGoalScreenBody (): ReactElement {
    const appState = AppState.instance()
    const goalsModel = GoalsModel.instance()
    const operationsModel = OperationsModel.instance()

    const [goalName, tabName, opId] = run(() => {
        const params = useParams()
        const goalName = nonNull(params.goalName, 'goalName expected here')
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
    const [total, setTotal] = useState<number>(0)

    const newGoalNameTrimmed = newGoal?.name.trim()

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

    useEffect(() => {
        appState.setSubTitle(`Goals :: ${newGoal?.name ?? 'loading...'}`)
    }, [newGoal?.name])

    useEffect(() => {
        runAsync(async () => {
            if (
                newGoal === null ||
                operationsModel.operations === null
            ) {
                return
            }

            const predicate = PE.filter(newGoal.filter)

            const stats = await calcStats(predicate, appState.timeSpan, appState.today, {
                total: periodExpensesReducer(null, predicate, newGoal.currency)
            })

            setTotal(stats.total[0])
        })
    }, [newGoal, operationsModel.operations, appState.timeSpanInfo])

    const statsFilter = useMemo(() => newGoal !== null ? PE.filter(newGoal.filter) : null, [newGoal])

    if (
        goal === null ||
        newGoal === null ||
        newGoalNameTrimmed === undefined
    ) {
        return <Box p={1}><ExpensesGroupScreenSkeleton /></Box>
    }

    const cur = (amount: number, compact = false): string => formatCurrency(amount, newGoal.currency, compact)

    return <>
        <Column height={'100%'}>
            <Box p={1}>
                <Typography variant={'h6'} textAlign={'center'} mt={1}>
                    {newGoal.name.trim() === '' ? '-' : newGoal.name}
                </Typography>
                <Typography variant={'h6'} textAlign={'center'} color={'primary.main'} mb={1}>
                    {cur(-total)}
                </Typography>
                <Typography variant={'body2'} textAlign={'center'}>
                    {'Goal (30d): '}{cur(30 * newGoal.perDayAmount)}
                </Typography>
                <Tabs
                    value={tabName}
                    onChange={(_, tab) => { navigate(`/goals/${encodeURIComponent(goal.name)}/${tab as string}`) }}
                    variant={'fullWidth'}
                >
                    <Tab value={'stats'} label={'Stats'}/>
                    <Tab value={'modify'} label={'Modify'}/>
                    <Tab value={'operations'} label={'Operations'}/>
                </Tabs>
            </Box>
            <Box overflow={'auto'} flex={'1 1 auto'}>
                <Box px={1}>
                    {
                        match(tabName)
                            .with('stats', () => <ExpensesStatsWidget
                                currency={newGoal.currency}
                                predicate={statsFilter!}
                                perDayGoal={newGoal.perDayAmount}
                            />)
                            .with('modify', () => {
                                return <>
                                    <ExpensesGoalEditor goal={newGoal} onChange={setNewGoal} />
                                    <Button
                                        variant={'contained'}
                                        fullWidth
                                        color={'error'}
                                        sx={{ mt: 5 }}
                                        onClick={() => {
                                            runAsync(async () => {
                                                await goalsModel.put({ ...goal, deleted: true })
                                                navigate('/goals')
                                            })
                                        }}
                                    >
                                        {'Delete'}
                                    </Button>
                                </>
                            })
                            .with('operations', () => <OpsList
                                noFab
                                onOpClick={(opId) => {
                                    navigate(`/goals/${goalName}/operations/${opId}`)
                                }}
                                predicate={PE.and(EXPENSE_PREDICATE, PE.filter(newGoal.filter))}
                            />)
                            .otherwise(() => { throw Error('Unimplenented tab') })
                    }
                    <Box minHeight={80}/>
                </Box>
            </Box>
        </Column>
        {
            showIfLazy(opId !== null, () => {
                return <FullScreenModal
                    width={'850px'}
                    title={opModalTitle}
                    onClose={() => { navigate(`/goals/${goalName}/operations`) }}
                >
                    <Box p={1}>
                        <OperationScreenBody
                            urlOpId={opId ?? ''}
                            setModalTitle={setOpModalTitle}
                        />
                    </Box>
                </FullScreenModal>
            })
        }
    </>
})
