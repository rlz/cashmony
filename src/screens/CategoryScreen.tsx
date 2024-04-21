import './CategoryScreen.scss'

import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, Fab, Tab, Tabs, Typography, useTheme } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { formatCurrency } from '../helpers/currencies'
import { nonNull, run, runAsync, showIfLazy } from '../helpers/smallTools'
import { screenWidthIs } from '../helpers/useWidth'
import { AppState } from '../model/appState'
import { CategoriesModel } from '../model/categories'
import { type Category } from '../model/model'
import { OperationsModel } from '../model/operations'
import { EXPENSE_PREDICATE, PE, type Predicate } from '../model/predicateExpression'
import { calcStats, hasOperation } from '../model/stats'
import { periodExpensesReducer } from '../model/statsReducers'
import { AddCategory } from '../widgets/expenses/editors/AddCategory'
import { CategoryEditor } from '../widgets/expenses/editors/CategoryEditor'
import { ExpensesGroupScreenSkeleton } from '../widgets/expenses/ExpensesGroupScreenSkeleton'
import { ExpensesList } from '../widgets/expenses/ExpensesList'
import { ExpensesStatsWidget } from '../widgets/expenses/ExpensesStatsWidget'
import { FullScreenModal } from '../widgets/FullScreenModal'
import { Column } from '../widgets/generic/Containers'
import { ResizeHandle } from '../widgets/generic/resizeHandle'
import { DivBody2 } from '../widgets/generic/Typography'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'
import { OperationScreenBody } from './OperationScreen'

export function CategoryScreen(): ReactElement {
    const appState = AppState.instance()
    const smallScreen = screenWidthIs('xs', 'sm')
    const location = useLocation()
    const theme = useTheme()
    const noCatSelected = location.pathname === '/categories'

    useEffect(() => {
        if (noCatSelected) {
            appState.setSubTitle('Categories')
            appState.setOnClose(null)
        }
    }, [noCatSelected])

    return (
        <MainScreen>
            {
            smallScreen
                ? (
                    <Box height={'100%'} position={'relative'}>
                        <Box height={'100%'}>
                            <CategoriesScreenBody noFab={!noCatSelected} />
                        </Box>
                        {
                        showIfLazy(!noCatSelected, () => {
                            return (
                                <Box
                                    position={'absolute'}
                                    top={0}
                                    left={0}
                                    height={'100%'}
                                    width={'100%'}
                                    bgcolor={theme.palette.background.default}
                                >
                                    <CategoryScreenBody />
                                </Box>
                            )
                        })
                    }
                    </Box>
                    )
                : (
                    <PanelGroup direction={'horizontal'}>
                        <Panel>
                            <CategoriesScreenBody noFab={!noCatSelected} />
                        </Panel>
                        {
                        showIfLazy(!noCatSelected, () => {
                            return (
                                <>
                                    <ResizeHandle />
                                    <Panel>
                                        <CategoryScreenBody />
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

export const CategoryScreenBody = observer((): ReactElement => {
    const appState = AppState.instance()
    const operationsModel = OperationsModel.instance()
    const categoriesModel = CategoriesModel.instance()

    const [catName, tabName, opId] = run(() => {
        const params = useParams()
        const catName = nonNull(params.catName, 'catName expected here')
        const opId = params.opId
        if (opId !== undefined) {
            return [catName, 'operations', opId]
        }

        const tabName = params.tabName ?? 'stats'
        return [catName, tabName, null]
    })

    const [cat, setCat] = useState<Category | null>(null)
    const navigate = useNavigate()
    const [opModalTitle, setOpModalTitle] = useState('')
    const [stats, setStats] = useState<{ total: number } | null>(null)

    const currency = cat?.currency ?? appState.masterCurrency

    useEffect(() => {
        appState.setOnClose(() => {
            navigate('/categories')
        })
    }, [])

    useEffect(() => {
        if (
            cat === null
            || stats === null
        ) {
            appState.setSubTitle('Category :: loading...')
        } else {
            const name = match(catName)
                .with('_', () => 'Uncategorized')
                .with('_total', () => 'Total')
                .otherwise(() => catName)

            appState.setSubTitle(`Category :: ${name}`)
        }
    }, [cat, stats])

    useEffect(
        () => {
            if (catName === '_' || catName === '_total') {
                const category: Category = {
                    name: catName,
                    lastModified: DateTime.utc(),
                    perDayAmount: run(() => {
                        const v = match(catName)
                            .with('_', () => appState.uncategorizedGoalAmount ?? undefined)
                            .with('_total', () => appState.totalGoalAmount ?? undefined)
                            .exhaustive()
                        return v ?? undefined
                    }),
                    currency: match(catName)
                        .with('_', () => appState.uncategorizedGoalAmount !== null ? appState.uncategorizedGoalCurrency ?? undefined : undefined)
                        .with('_total', () => appState.totalGoalAmount !== null ? appState.totalGoalCurrency ?? undefined : undefined)
                        .exhaustive()
                }
                setCat(category)
                return
            }
            const category = categoriesModel.get(catName)
            setCat(category)
        },
        [
            catName,
            categoriesModel.categories,
            appState.masterCurrency,
            appState.totalGoalAmount,
            appState.totalGoalCurrency,
            appState.uncategorizedGoalAmount,
            appState.uncategorizedGoalCurrency
        ]
    )

    const predicate = useMemo(() => {
        return match<string, Predicate>(catName)
            .with('_total', () => EXPENSE_PREDICATE)
            .with('_', () => PE.and(PE.type('expense'), PE.uncat()))
            .otherwise(() => PE.cat(catName))
    }, [catName])

    useEffect(
        () => {
            runAsync(async () => {
                const stats = await calcStats(predicate, appState.timeSpan, appState.today, {
                    total: periodExpensesReducer(null, predicate, currency)
                })

                setStats({
                    total: stats.total[0]
                })
            })
        }, [operationsModel.operations, catName, appState.timeSpanInfo]
    )

    if (
        cat === null
        || stats === null
    ) {
        return <ExpensesGroupScreenSkeleton />
    }

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    return (
        <>
            <Column height={'100%'}>
                <Box p={1}>
                    <Typography variant={'h6'} textAlign={'center'} mt={1}>
                        {
                        match(cat.name.trim())
                            .with('', () => '-')
                            .with('_', () => 'Uncategorized')
                            .with('_total', () => 'Total')
                            .otherwise(v => v)
                    }
                    </Typography>
                    <Typography variant={'h6'} textAlign={'center'} color={'primary.main'} mb={1}>
                        {cur(-stats.total)}
                    </Typography>
                    <Typography variant={'body2'} textAlign={'center'}>
                        {'Goal (30d): '}
                        {cat.perDayAmount !== undefined ? cur(30 * cat.perDayAmount) : '-'}
                    </Typography>
                    <Tabs value={tabName} onChange={(_, tab) => { navigate(`/categories/${catName}/${tab as string}`) }} variant={'fullWidth'}>
                        <Tab value={'stats'} label={'Stats'} />
                        <Tab value={'modify'} label={'Modify'} />
                        <Tab value={'operations'} label={'Operations'} />
                    </Tabs>
                </Box>
                <Box overflow={'auto'} flex={'1 1 auto'}>
                    <Box px={1}>
                        {
                        match(tabName)
                            .with('stats', () => (
                                <ExpensesStatsWidget
                                    currency={currency}
                                    predicate={predicate}
                                    perDayGoal={cat.perDayAmount ?? null}
                                />
                            ))
                            .with('modify', () => (
                                <CategoryEditor
                                    cat={cat}
                                    setCat={setCat}
                                />
                            ))
                            .with('operations', () => (
                                <OpsList
                                    noFab
                                    onOpClick={(opId) => {
                                        navigate(`/categories/${catName}/operations/${opId}`)
                                    }}
                                    predicate={predicate}
                                />
                            ))
                            .otherwise(() => { throw Error('Unimplenented tab') })
                    }
                        <Box minHeight={72} />
                    </Box>
                </Box>
            </Column>
            {
            showIfLazy(opId !== null, () => {
                return (
                    <FullScreenModal
                        width={'850px'}
                        title={opModalTitle}
                        onClose={() => { navigate(`/categories/${catName}/operations`) }}
                    >
                        <Box p={1}>
                            <OperationScreenBody
                                urlOpId={opId ?? ''}
                                setModalTitle={setOpModalTitle}
                            />
                        </Box>
                    </FullScreenModal>
                )
            })
        }
        </>
    )
})
CategoryScreenBody.displayName = 'CategoryScreenBody'

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

    const cats = useMemo(
        () => {
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

            return cats
        },
        [
            appState.totalGoalAmount,
            appState.totalGoalCurrency,
            appState.uncategorizedGoalAmount,
            appState.uncategorizedGoalCurrency,
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
                            <FontAwesomeIcon icon={faPlus} />
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
                        <FontAwesomeIcon icon={faPlus} />
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
CategoriesScreenBody.displayName = 'CategoriesScreenBody'
