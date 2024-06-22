import { Box, Button, Tab, Tabs, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { Watch } from '../../../engine/model'
import { EXPENSE_PREDICATE, PE } from '../../../engine/predicateExpression'
import { calcStats } from '../../../engine/stats'
import { periodExpensesReducer } from '../../../engine/statsReducers'
import { formatCurrency } from '../../helpers/currencies'
import { nonNull, run, runAsync, showIfLazy } from '../../helpers/smallTools'
import { useFrontState } from '../../model/FrontState'
import { useCurrenciesLoader } from '../../useCurrenciesLoader'
import { useEngine } from '../../useEngine'
import { ExpensesGroupScreenSkeleton } from '../../widgets/expenses/ExpensesGroupScreenSkeleton'
import { ExpensesStatsWidget } from '../../widgets/expenses/ExpensesStatsWidget'
import { FullScreenModal } from '../../widgets/FullScreenModal'
import { Column } from '../../widgets/generic/Containers'
import { OpsList } from '../../widgets/operations/OpsList'
import { OperationScreenBody } from '../OperationScreen'
import { ExpensesGoalEditor } from './ExpensesGoalEditor'

export const ExpensesGoalBody = observer(function ExpensesGoalBody(): JSX.Element {
    const engine = useEngine()
    const appState = useFrontState()
    const currenciesLoader = useCurrenciesLoader()

    const [goalId, tabName, opId] = run(() => {
        const params = useParams()
        const goalId = nonNull(params.goalId, 'goalName expected here')
        const opId = params.opId
        if (opId !== undefined) {
            return [goalId, 'operations', opId]
        }

        const tabName = params.tabName ?? 'stats'
        return [goalId, tabName, null]
    })

    const navigate = useNavigate()
    const [goal, setGoal] = useState<Watch | null>(null)
    const [newGoal, setNewGoal] = useState<Watch | null>(null)
    const [opModalTitle, setOpModalTitle] = useState('')
    const [total, setTotal] = useState<number>(0)

    const newGoalNameTrimmed = newGoal?.name.trim()

    useEffect(
        () => {
            const g = engine.getWatch(goalId)
            setGoal(g)
            setNewGoal(g)
        },
        [
            engine.watches,
            goalId
        ]
    )

    useEffect(() => {
        appState.setSubTitle(`Goals :: ${newGoal?.name ?? 'loading...'}`)
    }, [newGoal?.name])

    useEffect(() => {
        runAsync(async () => {
            if (
                newGoal === null
            ) {
                return
            }

            const predicate = PE.filter(newGoal.filter)

            const stats = await calcStats(engine, predicate, appState.timeSpan, appState.today, {
                total: periodExpensesReducer(engine, currenciesLoader, null, predicate, newGoal.currency)
            })

            setTotal(stats.total[0])
        })
    }, [newGoal, engine.operations, appState.timeSpanInfo])

    const statsFilter = useMemo(() => newGoal !== null ? PE.and(EXPENSE_PREDICATE, PE.filter(newGoal.filter)) : null, [newGoal])

    if (
        goal === null
        || newGoal === null
        || newGoalNameTrimmed === undefined
    ) {
        return <Box p={1}><ExpensesGroupScreenSkeleton /></Box>
    }

    const cur = (amount: number, compact = false): string => formatCurrency(amount, newGoal.currency, compact)

    return (
        <>
            <Column height={'100%'}>
                <Box p={1}>
                    <Typography variant={'h6'} textAlign={'center'} mt={1}>
                        {newGoal.name.trim() === '' ? '-' : newGoal.name}
                    </Typography>
                    <Typography variant={'h6'} textAlign={'center'} color={'primary.main'} mb={1}>
                        {cur(-total)}
                    </Typography>
                    <Typography variant={'body2'} textAlign={'center'}>
                        {'Goal (30d): '}
                        {cur(30 * newGoal.perDayAmount)}
                    </Typography>
                    <Tabs
                        value={tabName}
                        onChange={(_, tab) => { navigate(`/goals/${encodeURIComponent(goal.id)}/${tab as string}`) }}
                        variant={'fullWidth'}
                    >
                        <Tab value={'stats'} label={'Stats'} />
                        <Tab value={'modify'} label={'Modify'} />
                        <Tab value={'operations'} label={'Operations'} />
                    </Tabs>
                </Box>
                <Box overflow={'auto'} flex={'1 1 auto'}>
                    <Box px={1}>
                        {
                            match(tabName)
                                .with('stats', () => (
                                    <ExpensesStatsWidget
                                        currency={newGoal.currency}
                                        predicate={statsFilter!}
                                        perDayGoal={newGoal.perDayAmount}
                                    />
                                ))
                                .with('modify', () => {
                                    return (
                                        <>
                                            <ExpensesGoalEditor goal={newGoal} onChange={setNewGoal} />
                                            <Button
                                                variant={'contained'}
                                                fullWidth
                                                color={'error'}
                                                sx={{ mt: 5 }}
                                                onClick={() => {
                                                    engine.pushWatch({ ...goal, deleted: true, lastModified: DateTime.utc() })
                                                    navigate('/goals')
                                                }}
                                            >
                                                {'Delete'}
                                            </Button>
                                        </>
                                    )
                                })
                                .with('operations', () => (
                                    <OpsList
                                        onOpClick={(opId) => {
                                            navigate(`/goals/${goalId}/operations/${opId}`)
                                        }}
                                        predicate={PE.and(EXPENSE_PREDICATE, PE.filter(newGoal.filter))}
                                    />
                                ))
                                .otherwise(() => { throw Error('Unimplenented tab') })
                        }
                        <Box minHeight={80} />
                    </Box>
                </Box>
            </Column>
            {
                showIfLazy(opId !== null, () => {
                    return (
                        <FullScreenModal
                            width={'850px'}
                            title={opModalTitle}
                            onClose={() => { navigate(`/goals/${goalId}/operations`) }}
                        >
                            <Box p={1}>
                                <OperationScreenBody
                                    urlOpId={opId ?? ''}
                                    setModalTitle={setOpModalTitle}
                                />
                            </Box>
                        </FullScreenModal>
                    )
                })
            }
        </>
    )
})
