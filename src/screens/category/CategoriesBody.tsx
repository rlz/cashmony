import { Add as AddIcon } from '@mui/icons-material'
import { Box, Button, Fab, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { useMemo, useState } from 'react'

import { runAsync } from '../../helpers/smallTools'
import { CategoriesModel } from '../../model/categories'
import { type Category } from '../../model/model'
import { AddCategory } from '../../widgets/expenses/editors/AddCategory'
import { ExpensesList } from '../../widgets/expenses/ExpensesList'
import { Column } from '../../widgets/generic/Containers'
import { DivBody2 } from '../../widgets/generic/Typography'

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
].map((i) => { return { name: i, lastModified: DateTime.utc() } })

export const CategoriesScreenBody = observer(function CategoriesScreenBody({ noFab }: CategoriesScreenBodyProps): JSX.Element {
    const categoriesModel = CategoriesModel.instance()

    const [addCategory, setAddCategory] = useState(false)

    const cats = useMemo(
        () => {
            const cats: Category[] = categoriesModel
                .categoriesSorted
                .map(c => categoriesModel.get(c))
                .filter(c => c.deleted !== true)

            return cats
        },
        [
            categoriesModel.categories
        ]
    )

    if (categoriesModel.categories?.size === 0) {
        return (
            <>
                {
                addCategory
                    ? (
                        <AddCategory
                            onClose={() => { setAddCategory(false) }}
                        />
                        )
                    : undefined
            }
                {
                addCategory || noFab === true
                    ? null
                    : (
                        <Fab
                            color={'primary'}
                            sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                            onClick={() => { setAddCategory(true) }}
                        >
                            <AddIcon />
                        </Fab>
                        )
            }
                <Column textAlign={'center'} alignItems={'center'} mt={3}>
                    <Box>
                        {'Before start tracking your finances you need to create a category'}
                        <br />
                        {'You will mark all your expenses as related to one or another category'}
                        <br />
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
                                await Promise.all(DEFAULT_CATEGORIES.map(async (c) => { await categoriesModel.put(c) }))
                            })
                        }}
                    >
                        {'Predefined categories'}
                    </Button>
                </Column>
            </>
        )
    }

    return (
        <>
            {
            addCategory
                ? (
                    <AddCategory
                        onClose={() => { setAddCategory(false) }}
                    />
                    )
                : undefined
        }
            {
            addCategory || noFab === true
                ? null
                : (
                    <Fab
                        color={'primary'}
                        sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                        onClick={() => { setAddCategory(true) }}
                    >
                        <AddIcon />
                    </Fab>
                    )
        }
            <Box p={1} height={'100%'} overflow={'auto'}>
                <Box maxWidth={900} mx={'auto'}>
                    <ExpensesList categories={cats} />
                    <Box minHeight={144} />
                </Box>
            </Box>
        </>
    )
})
