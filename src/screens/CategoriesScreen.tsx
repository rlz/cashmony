import './CategoriesScreen.scss'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Fab } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useState } from 'react'
import { match } from 'ts-pattern'

import { run, showIf } from '../helpers/smallTools'
import { AppState } from '../model/appState'
import { CategoriesModel } from '../model/categories'
import { ExpensesStats, Operations } from '../model/stats'
import { AddCategory } from '../widgets/expenses/editors/AddCategory'
import { ExpensesCard } from '../widgets/expenses/ExpensesCard'
import { ExpensesList } from '../widgets/expenses/ExpensesList'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { Bold, Italic } from '../widgets/Typography'

export const CategoriesScreen = observer((): ReactElement => {
    return <MainScreen>
        <CategoriesScreenBody />
    </MainScreen>
})
CategoriesScreen.displayName = 'CategoriesScreen'

export const CategoriesScreenBody = observer((): ReactElement => {
    const appState = AppState.instance()
    const categoriesModel = CategoriesModel.instance()

    const [addCategory, setAddCategory] = useState(false)

    const cats = categoriesModel
        .categoriesSorted
        .map(c => categoriesModel.get(c))
        .filter(c => c.deleted !== true)

    return <>
        {
            match(addCategory)
                .with(
                    true, () => <AddCategory
                        onClose={() => { setAddCategory(false) }}
                    />
                )
                .otherwise(
                    () => <Fab
                        color='primary'
                        sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                        onClick={() => { setAddCategory(true) }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </Fab>
                )
        }
        <Box p={1} height='100%' overflow='scroll'>
            <Box maxWidth={900} mx='auto'>
                <ExpensesCard
                    url='/categories/_total'
                    name={<Bold>Total</Bold>}
                    stats={new ExpensesStats(Operations.forFilter(appState.filter), null)}
                    sx={{ mb: 1 }}
                />
                <ExpensesList items={cats}/>
                {
                    run(() => {
                        const stats = new ExpensesStats(Operations.forFilter(appState.filter).onlyUncategorized(), null)
                        return showIf(
                            stats.operations.count() > 0,
                            <ExpensesCard
                                url='/categories/_'
                                name={<Italic>Uncategorized</Italic>}
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
