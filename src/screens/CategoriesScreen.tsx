import './CategoriesScreen.scss'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Fab } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { match } from 'ts-pattern'

import { runAsync } from '../helpers/smallTools'
import { AppState } from '../model/appState'
import { CategoriesModel } from '../model/categories'
import { type Category } from '../model/model'
import { OperationsModel } from '../model/operations'
import { PE } from '../model/predicateExpression'
import { ExpensesStats, hasOperation, Operations } from '../model/stats'
import { AddCategory } from '../widgets/expenses/editors/AddCategory'
import { ExpensesList } from '../widgets/expenses/ExpensesList'
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
    const appState = AppState.instance()
    const operationsModel = OperationsModel.instance()
    const categoriesModel = CategoriesModel.instance()

    const [addCategory, setAddCategory] = useState(false)
    const [hasUncat, setHasUncat] = useState(false)

    useEffect(
        () => {
            runAsync(async () => {
                if (operationsModel.operations === null) {
                    return
                }

                setHasUncat(
                    hasOperation(PE.and(PE.type('expense'), PE.uncat()), appState.timeSpan)
                )
            })
        },
        [
            appState.timeSpanInfo,
            operationsModel.operations
        ]
    )

    const cats: Category[] = [
        {
            name: '_total',
            lastModified: DateTime.utc(),
            perDayAmount: appState.totalGoalAmount ?? undefined,
            currency: appState.totalGoalAmount === null ? undefined : appState.totalGoalCurrency
        },
        ...categoriesModel
            .categoriesSorted
            .map(c => categoriesModel.get(c))
            .filter(c => c.deleted !== true)
    ]

    if (hasUncat) {
        cats.push({
            name: '_',
            lastModified: DateTime.utc(),
            perDayAmount: appState.uncategorizedGoalAmount ?? undefined,
            currency: appState.uncategorizedGoalAmount === null ? undefined : appState.uncategorizedGoalCurrency
        })
    }

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
                <ExpensesList categories={cats}/>
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
