import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Fab } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { showIfLazy } from '../../helpers/smallTools'
import { screenWidthIs } from '../../helpers/useWidth'
import { useFrontState } from '../../model/FrontState'
import { useEngine } from '../../useEngine'
import { ExpensesList } from '../../widgets/expenses/ExpensesList'
import { ResizeHandle } from '../../widgets/generic/resizeHandle'
import { MainScreen } from '../../widgets/mainScreen/MainScreen'
import { AddExpensesGoalModal } from './AddExpensesGoalModal'
import { ExpensesGoalBody } from './ExpensesGoalBody'

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
            navigate('/goals')
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
                    <PanelGroup direction={'horizontal'}>
                        <Panel id={'list'} order={1}>
                            <ExpensesGoalsScreenBody noFab={params.goalId !== undefined} />
                        </Panel>
                        {
                            showIfLazy(params.goalId !== undefined, () => {
                                return (
                                    <>
                                        <ResizeHandle />
                                        <Panel id={'single'} order={2}>
                                            <ExpensesGoalBody />
                                        </Panel>
                                    </>
                                )
                            })
                        }
                    </PanelGroup>
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
