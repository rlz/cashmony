import { Add as AddIcon } from '@mui/icons-material'
import { Box, Fab } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { JSX, useMemo, useState } from 'react'

import { sortCategoriesByUsage } from '../../../engine/sortCategories'
import { useEngine } from '../../useEngine'
import { ExpensesList } from '../../widgets/expenses/ExpensesList'
import { AddCategory } from './AddCategory'

interface CategoriesScreenBodyProps {
    noFab?: boolean
}

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
                <Box textAlign={'center'} mt={3}>
                    {'You need to add category'}
                </Box>
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
