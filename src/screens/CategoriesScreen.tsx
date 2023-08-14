import './CategoriesScreen.scss'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, Fab, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'

import { runAsync } from '../helpers/smallTools'
import { AppState } from '../model/appState'
import { CategoriesModel } from '../model/categories'
import { type Category } from '../model/model'
import { OperationsModel } from '../model/operations'
import { PE } from '../model/predicateExpression'
import { hasOperation } from '../model/stats'
import { AddCategory } from '../widgets/expenses/editors/AddCategory'
import { ExpensesList } from '../widgets/expenses/ExpensesList'
import { Column } from '../widgets/generic/Containers'
import { DivBody2 } from '../widgets/generic/Typography'
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

const DEFAULT_CATEGORIES: Category[] = [
    'Food & Drinks',
    'Shopping',
    'Housing',
    'Transportation',
    'Entertainment',
    'Electronics',
    'Financial',
    'Investment',
    'Education',
    'Health',
    'Travel'
].map(i => { return { name: i, lastModified: DateTime.utc() } })

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

    if (categoriesModel.categories?.size === 0) {
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
            <Column textAlign={'center'} alignItems={'center'} mt={3}>
                <Box>
                    {'Before start tracking your finances you need to create a category'}<br/>
                    {'You will mark all your expenses as related to one or another category'}<br/>
                    {'You can create as many categories as you need'}
                </Box>
                <Typography my={2} fontSize={'1.5rem'}>
                    {'or'}
                </Typography>
                <Box>
                    {'Create start with predefined set of categories'}
                </Box>
                <DivBody2 mb={1}>
                    {'(you can always change it later)'}
                </DivBody2>
                <Button
                    variant={'contained'}
                    onClick={() => {
                        runAsync(async () => {
                            await Promise.all(DEFAULT_CATEGORIES.map(async c => { await categoriesModel.put(c) }))
                        })
                    }}
                >
                    {'Predefined categories'}
                </Button>
            </Column>
        </>
    }

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
        <Box p={1} height={'100%'} overflow={'auto'}>
            <Box maxWidth={900} mx={'auto'}>
                <ExpensesList categories={cats}/>
                <Box minHeight={144}/>
            </Box>
        </Box>
    </>
})
CategoriesScreenBody.displayName = 'CategoriesScreenBody'
