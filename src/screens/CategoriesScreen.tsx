import './CategoriesScreen.scss'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Fab } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { match } from 'ts-pattern'

import { run, showIf } from '../helpers/smallTools'
import { AppState } from '../model/appState'
import { CategoriesModel } from '../model/categories'
import { PE } from '../model/predicateExpression'
import { ExpensesStats, Operations } from '../model/stats'
import { AddCategory } from '../widgets/expenses/editors/AddCategory'
import { ExpensesCard } from '../widgets/expenses/ExpensesCard'
import { ExpensesList } from '../widgets/expenses/ExpensesList'
import { Bold, Italic } from '../widgets/generic/Typography'
import { MainScreen } from '../widgets/mainScreen/MainScreen'

export const CategoriesScreen = observer(function CategoriesScreen (): ReactElement {
    const appState = AppState.instance()

    useEffect(() => {
        appState.setSubTitle('Categories')
        appState.setOnClose(null)
    }, [])

    return <MainScreen>
        <CategoriesScreenBody />
    </MainScreen>
})

interface CategoriesScreenBodyProps {
    noFab?: boolean
}

export const CategoriesScreenBody = observer(({ noFab }: CategoriesScreenBodyProps): ReactElement => {
    const categoriesModel = CategoriesModel.instance()

    const [addCategory, setAddCategory] = useState(false)

    const cats = categoriesModel
        .categoriesSorted
        .map(c => categoriesModel.get(c))
        .filter(c => c.deleted !== true)

    return <>
        {
            addCategory
                ? <AddCategory
                    onClose={() => { setAddCategory(false) }}
                />
                : undefined
        }
        {
            addCategory || noFab === true
                ? null
                : <Fab
                    color={'primary'}
                    sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                    onClick={() => { setAddCategory(true) }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                </Fab>
        }
        <Box p={1} height={'100%'} overflow={'scroll'}>
            <Box maxWidth={900} mx={'auto'}>
                <ExpensesCard
                    url={'/categories/_total'}
                    name={<Bold>{'Total'}</Bold>}
                    stats={getTotalStats()}
                    sx={{ mb: 1 }}
                />
                <ExpensesList items={cats}/>
                {
                    run(() => {
                        const stats = getUncategorizedStats()
                        return showIf(
                            stats.operations.count() > 0,
                            <ExpensesCard
                                url={'/categories/_'}
                                name={<Italic>{'Uncategorized'}</Italic>}
                                stats={stats}
                            />
                        )
                    })
                }
                <Box minHeight={144}/>
            </Box>
        </Box>
    </>
})
CategoriesScreenBody.displayName = 'CategoriesScreenBody'

export function getTotalStats (): ExpensesStats {
    const appState = AppState.instance()

    return new ExpensesStats(
        Operations.get(
            PE.or(
                PE.type('expense'),
                PE.and(PE.type('income'), PE.not(PE.uncat()))
            )
        ),
        match(appState.totalGoalAmount).with(null, () => null).otherwise(v => { return { value: v, currency: appState.totalGoalCurrency } })
    )
}

export function getUncategorizedStats (): ExpensesStats {
    const appState = AppState.instance()

    return new ExpensesStats(
        Operations.get(PE.and(PE.type('expense'), PE.uncat())),
        match(appState.uncategorizedGoalAmount).with(null, () => null).otherwise(v => { return { value: v, currency: appState.uncategorizedGoalCurrency } })
    )
}
