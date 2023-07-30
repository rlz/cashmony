import { Box, Tab, Tabs, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { formatCurrency } from '../helpers/currencies'
import { nonNull, run, runAsync, showIfLazy } from '../helpers/smallTools'
import { screenWidthIs } from '../helpers/useWidth'
import { AppState } from '../model/appState'
import { CategoriesModel } from '../model/categories'
import { type Category } from '../model/model'
import { OperationsModel } from '../model/operations'
import { EXPENSE_PREDICATE, PE, type Predicate } from '../model/predicateExpression'
import { calcStats } from '../model/stats'
import { periodExpensesReducer } from '../model/statsReducers'
import { CategoryEditor } from '../widgets/expenses/editors/CategoryEditor'
import { ExpensesGroupScreenSkeleton } from '../widgets/expenses/ExpensesGroupScreenSkeleton'
import { ExpensesStatsWidget } from '../widgets/expenses/ExpensesStatsWidget'
import { FullScreenModal } from '../widgets/FullScreenModal'
import { Column } from '../widgets/generic/Containers'
import { ResizeHandle } from '../widgets/generic/resizeHandle'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'
import { CategoriesScreenBody } from './CategoriesScreen'
import { OperationScreenBody } from './OperationScreen'

export function CategoryScreen (): ReactElement {
    const appState = AppState.instance()
    const navigate = useNavigate()
    const smallScreen = screenWidthIs('xs', 'sm')

    useEffect(() => {
        appState.setOnClose(() => {
            navigate('/categories')
        })
    }, [])

    return <MainScreen>
        {
            smallScreen
                ? <CategoryScreenBody />
                : <PanelGroup direction={'horizontal'}>
                    <Panel>
                        <CategoriesScreenBody noFab/>
                    </Panel>
                    <ResizeHandle />
                    <Panel>
                        <CategoryScreenBody />
                    </Panel>
                </PanelGroup>
        }
    </MainScreen>
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
        if (
            cat === null ||
            stats === null
        ) {
            appState.setSubTitle('Category :: loading...')
        } else {
            const name = match(catName)
                .with('_', () => 'Uncategorized')
                .with('_total', () => 'Total')
                .otherwise(() => catName)

            appState.setSubTitle(`Category :: ${name}`)
        }
    }, [cat])

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
                        return v !== undefined ? v : undefined
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

    const predicate = match<string, Predicate>(catName)
        .with('_total', () => EXPENSE_PREDICATE)
        .with('_', () => PE.and(PE.type('expense'), PE.uncat()))
        .otherwise(() => PE.cat(catName))

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
        }, [operationsModel.operations, catName]
    )

    if (
        cat === null ||
        stats === null
    ) {
        return <ExpensesGroupScreenSkeleton />
    }

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    return <>
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
                    {'Goal (30d): '}{cat.perDayAmount !== undefined ? cur(-30 * cat.perDayAmount) : '-'}
                </Typography>
                <Tabs value={tabName} onChange={(_, tab) => { navigate(`/categories/${catName}/${tab as string}`) }} variant={'fullWidth'}>
                    <Tab value={'stats'} label={'Stats'}/>
                    <Tab value={'modify'} label={'Modify'}/>
                    <Tab value={'operations'} label={'Operations'}/>
                </Tabs>
            </Box>
            <Box overflow={'scroll'} flex={'1 1 auto'}>
                <Box px={1}>
                    {
                        match(tabName)
                            .with('stats', () => <ExpensesStatsWidget
                                currency={currency}
                                predicate={predicate}
                                perDayGoal={cat.perDayAmount ?? null}
                            />)
                            .with('modify', () => <CategoryEditor
                                cat={cat}
                                setCat={setCat}
                            />)
                            .with('operations', () => <OpsList
                                noFab
                                onOpClick={(opId) => {
                                    navigate(`/categories/${catName}/operations/${opId}`)
                                }}
                                predicate={predicate}
                            />)
                            .otherwise(() => { throw Error('Unimplenented tab') })
                    }
                    <Box minHeight={72}/>
                </Box>
            </Box>
        </Column>
        {
            showIfLazy(opId !== null, () => {
                return <FullScreenModal
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
            })
        }
    </>
})
CategoryScreenBody.displayName = 'CategoryScreenBody'
