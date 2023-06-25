import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement } from 'react'
import { Box, Fab, Typography } from '@mui/material'
import { CategoriesModel } from '../model/categories'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { ExpensesStats, Operations } from '../model/stats'
import { type Category } from '../model/model'
import { AddCategory } from '../widgets/expenses/editors/AddCategory'
import './CategoriesScreen.scss'
import { AppState } from '../model/appState'
import { match } from 'ts-pattern'
import { run, showIf } from '../helpers/smallTools'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { ExpensesCard } from '../widgets/expenses/ExpensesCard'
import { ExpensesList } from '../widgets/expenses/ExpensesList'
import { Bold, Italic } from '../widgets/Typography'

export const CategoriesScreen = observer((): ReactElement => {
    const appState = AppState.instance()
    const categoriesModel = CategoriesModel.instance()

    const [showHidden, setShowHidden] = useState(false)
    const [addCategory, setAddCategory] = useState(false)

    const visibleCategories: Category[] = []
    const hiddenCategories: Category[] = []

    for (const c of categoriesModel.categoriesSorted.map(c => categoriesModel.get(c))) {
        if (c.deleted === true) continue
        if (c.hidden) {
            hiddenCategories.push(c)
            continue
        }
        visibleCategories.push(c)
    }

    return <MainScreen>
        {
            match(addCategory)
                .with(
                    true, () => <AddCategory
                        onClose={() => { setAddCategory(false) }}
                    />
                )
                .otherwise(
                    () => <Fab
                        color="primary"
                        sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                        onClick={() => { setAddCategory(true) }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </Fab>
                )
        }
        <ExpensesCard
            url="/categories/_total"
            name={<Bold>Total</Bold>}
            stats={new ExpensesStats(Operations.forFilter(appState.filter), null)}
            sx={{ mb: 1 }}
        />
        <ExpensesList items={showHidden ? [...visibleCategories, ...hiddenCategories] : visibleCategories}/>
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
        {
            !showHidden && hiddenCategories.length > 0
                ? <Typography color="primary.main" textAlign="center">
                    <a onClick={() => { setShowHidden(true) }}>Show {hiddenCategories.length} hidden</a>
                </Typography>
                : null
        }
        <Box minHeight={144}/>
    </MainScreen>
})
