import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Fab } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { Group, Panel } from 'react-resizable-panels'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { showIfLazy } from '../../helpers/smallTools.js'
import { screenWidthIs } from '../../helpers/useWidth.js'
import { useFrontState } from '../../model/FrontState.js'
import { useEngine } from '../../useEngine.js'
import { ExpensesList } from '../../widgets/expenses/ExpensesList.js'
import { ResizeHandle } from '../../widgets/generic/resizeHandle.js'
import { MainScreen } from '../../widgets/mainScreen/MainScreen.js'
import { AddExpensesGoalModal } from './AddExpensesGoalModal.js'
import { ExpensesGoalBody } from './ExpensesGoalBody.js'

export function ExpensesGoalScreen(): ReactElement {
    const appState = useFrontState()
    const params = useParams()
    const smallScreen = screenWidthIs('xs', 'sm')
    const navigate = useNavigate()

    useEffect(() => {
        if (params.goalId === undefined) {
            appState.setOnClose(null)
            return
        }

        appState.setOnClose(() => {
            void navigate('/goals')
        })
    }, [params.goalId])

    return (
        <MainScreen>
            {
                smallScreen
                    ? (
                            <>
                                <ExpensesGoalsScreenBody
                                    noFab={params.goalId !== undefined}
                                    hide={params.goalId !== undefined}
                                />
                                {
                                    showIfLazy(params.goalId !== undefined, () => {
                                        return <ExpensesGoalBody />
                                    })
                                }
                            </>
                        )
                    : (
                            <Group orientation={'horizontal'} style={{ height: '100%' }}>
                                <Panel id={'list'}>
                                    <ExpensesGoalsScreenBody noFab={params.goalId !== undefined} />
                                </Panel>
                                {
                                    showIfLazy(params.goalId !== undefined, () => {
                                        return (
                                            <>
                                                <ResizeHandle />
                                                <Panel id={'single'}>
                                                    <ExpensesGoalBody />
                                                </Panel>
                                            </>
                                        )
                                    })
                                }
                            </Group>
                        )
            }
        </MainScreen>
    )
}

interface ExpensesGoalsScreenBodyProps {
    noFab?: boolean
    hide?: boolean
}

export const ExpensesGoalsScreenBody = observer(({ noFab, hide }: ExpensesGoalsScreenBodyProps): ReactElement => {
    const appState = useFrontState()
    const engine = useEngine()

    const [add, setAdd] = useState(false)
    const location = useLocation()

    useEffect(() => {
        if (location.pathname === '/goals') {
            appState.setSubTitle('Goals')
        }
    }, [location.pathname])

    const goals = useMemo(
        () => {
            return engine.watches.filter(i => i.deleted !== true) ?? []
        },
        [engine.watches]
    )

    return (
        <>
            {
                add
                    ? (
                            <AddExpensesGoalModal
                                onClose={() => { setAdd(false) }}
                            />
                        )
                    : undefined
            }
            {
                add || noFab === true
                    ? undefined
                    : (
                            <Fab
                                color={'primary'}
                                sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                                onClick={() => { setAdd(true) }}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                            </Fab>
                        )
            }
            <Box p={1} height={'100%'} overflow={'auto'} display={hide === true ? 'none' : 'block'}>
                <Box maxWidth={900} mx={'auto'}>
                    <ExpensesList goals={goals} />
                    <Box minHeight={144} />
                </Box>
            </Box>
        </>
    )
})

// function EspensesGoalsScreenBodySkeleton(): ReactElement {
//     return (
//         <Column gap={1} p={1}>
//             <ExpensesCardSkeleton />
//             <ExpensesCardSkeleton />
//             <ExpensesCardSkeleton />
//         </Column>
//     )
// }
