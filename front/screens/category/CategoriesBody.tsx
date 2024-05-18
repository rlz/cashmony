import { Add as AddIcon } from '@mui/icons-material'
import { Box, Button, Fab, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { useMemo, useState } from 'react'

import { type Category } from '../../../engine/model'
import { sortCategoriesByUsage } from '../../../engine/sortCategories'
import { useEngine } from '../../useEngine'
import { ExpensesList } from '../../widgets/expenses/ExpensesList'
import { Column } from '../../widgets/generic/Containers'
import { DivBody2 } from '../../widgets/generic/Typography'
import { AddCategory } from './AddCategory'

interface CategoriesScreenBodyProps {
    noFab?: boolean
}

const DEFAULT_CATEGORIES: Category[] = [
    ['Food & Drinks', '018f5c89-63dd-7935-96e6-39a03733a26c'],
    ['Shopping', '018f5c89-63dd-724a-83b5-2ac259748c70'],
    ['Housing', '018f5c89-63dd-7314-a1f5-d3c9951db682'],
    ['Transportation', '018f5c89-63dd-781a-8129-264e7f8a7e64'],
    ['Entertainment', '018f5c89-63dd-7f88-9318-008e30898cae'],
    ['Electronics', '018f5c89-63dd-7342-8230-e0208e0862e4'],
    ['Financial', '018f5c89-63dd-7384-a41b-43c65f199bdd'],
    ['Investment', '018f5c89-63dd-75b4-bcd1-f4952194c7d9'],
    ['Education', '018f5c89-63dd-7574-b6ad-cb1d8cd1496c'],
    ['Health', '018f5c89-63dd-7a1b-a9d9-54383a2b5349'],
    ['Travel', '018f5c89-63dd-7bc5-ab72-2581a987ea41']
].map((i) => { return { id: i[1], name: i[0], lastModified: DateTime.utc() } })

export const CategoriesScreenBody = observer(function CategoriesScreenBody({ noFab }: CategoriesScreenBodyProps): JSX.Element {
    const engine = useEngine()

    const [addCategory, setAddCategory] = useState(false)

    const cats = useMemo(
        () => {
            return sortCategoriesByUsage(engine).filter(c => c.deleted !== true)
        },
        [
            engine.categories
        ]
    )

    if (engine.categories.length === 0) {
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
                        onClick={() => DEFAULT_CATEGORIES.map(c => engine.pushCategory(c))}
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
