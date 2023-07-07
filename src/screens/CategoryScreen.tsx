import { Box, Tab, Tabs, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { formatCurrency } from '../helpers/currencies'
import { utcToday } from '../helpers/dates'
import { deepEqual } from '../helpers/deepEqual'
import { nonNull, run, runAsync, showIfLazy } from '../helpers/smallTools'
import { useWidth, widthOneOf } from '../helpers/useWidth'
import { AppState } from '../model/appState'
import { CategoriesModel } from '../model/categories'
import { CurrenciesModel } from '../model/currencies'
import { type Category, type Operation } from '../model/model'
import { OperationsModel } from '../model/operations'
import { ExpensesStats, Operations } from '../model/stats'
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

type OnSaveType = (() => void) | null | undefined

export function CategoryScreen (): ReactElement {
    const bigScreen = !widthOneOf(useWidth(), ['xs', 'sm'])
    const [onSave, setOnSave] = useState<OnSaveType>(null)

    return <MainScreen
        navigateOnBack='/categories'
        title='Category'
        onSave={onSave}
    >
        {
            bigScreen
                ? <PanelGroup direction='horizontal'>
                    <Panel>
                        <CategoriesScreenBody/>
                    </Panel>
                    <ResizeHandle />
                    <Panel>
                        <CategoryScreenBody setOnSave={(onSave: OnSaveType) => { setOnSave((): OnSaveType => onSave) }}/>
                    </Panel>
                </PanelGroup>
                : <CategoryScreenBody setOnSave={(onSave: OnSaveType) => { setOnSave((): OnSaveType => onSave) }}/>
        }
    </MainScreen>
}

interface Props {
    setOnSave: (onSave: OnSaveType) => void
}

export const CategoryScreenBody = observer(({ setOnSave }: Props): ReactElement => {
    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    const categoriesModel = CategoriesModel.instance()
    const operationsModel = OperationsModel.instance()

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
    const [newCat, setNewCat] = useState<Category | null>(null)
    const navigate = useNavigate()
    const [opModalTitle, setOpModalTitle] = useState('')
    const [opModalOnSave, setOpModalOnSave] = useState<(() => Promise<void>) | null | undefined>(null)

    const currency = newCat?.currency ?? appState.masterCurrency

    useEffect(
        () => {
            if (
                cat === null ||
                newCat === null ||
                currenciesModel.rates === null
            ) {
                return
            }

            if (
                deepEqual(cat, newCat) ||
                newCat.name.trim() === '' ||
                (
                    newCat.name !== cat.name &&
                    categoriesModel.categories.has(newCat.name) &&
                    categoriesModel.get(newCat.name).deleted !== true
                )
            ) {
                setOnSave(null)
                return
            }

            setOnSave(() => {
                runAsync(
                    async () => {
                        if (catName === '_') {
                            runInAction(() => {
                                appState.uncategorizedGoalAmount = newCat.perDayAmount === undefined ? null : newCat.perDayAmount
                                appState.uncategorizedGoalCurrency = newCat.currency ?? 'USD'
                            })
                        } else if (catName === '_total') {
                            runInAction(() => {
                                appState.totalGoalAmount = newCat.perDayAmount === undefined ? null : newCat.perDayAmount
                                appState.totalGoalCurrency = newCat.currency ?? 'USD'
                            })
                        } else {
                            await categoriesModel.put({ ...newCat, lastModified: DateTime.utc() })
                        }

                        if (newCat.name !== cat.name) {
                            const changedOps: Operation[] = []
                            for (const op of operationsModel.operations) {
                                if (
                                    (op.type === 'expense' || op.type === 'income') &&
                            op.categories.find((c) => c.name === cat.name) !== undefined
                                ) {
                                    changedOps.push({
                                        ...op,
                                        lastModified: DateTime.utc(),
                                        categories: op.categories.map(c => {
                                            return {
                                                ...c,
                                                name: c.name === cat.name ? newCat.name : cat.name
                                            }
                                        })
                                    })
                                }
                            }
                            await operationsModel.put(changedOps)
                            await categoriesModel.put({ ...cat, deleted: true, lastModified: DateTime.utc() })
                            navigate(`/categories/${encodeURIComponent(newCat.name)}`)
                        }

                        setCat(newCat)
                    }
                )
            })
        },
        [
            cat,
            newCat
        ]
    )

    useEffect(
        () => {
            if (catName === '_' || catName === '_total') {
                const category: Category = {
                    name: match(catName)
                        .with('_', () => 'Uncategorized')
                        .with('_total', () => 'Total')
                        .exhaustive(),
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
                setNewCat(category)
                return
            }
            const category = categoriesModel.get(catName)
            setCat(category)
            setNewCat(category)
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

    if (
        cat === null ||
        newCat === null ||
        currenciesModel.rates === null
    ) {
        return <ExpensesGroupScreenSkeleton />
    }

    const stats = match(catName)
        .with('_total', () => new ExpensesStats(
            Operations.forFilter(appState.filter),
            match(appState.totalGoalAmount).with(null, () => null).otherwise(v => { return { value: v, currency: appState.totalGoalCurrency } })
        ))
        .with('_', () => new ExpensesStats(
            Operations.forFilter(appState.filter).onlyUncategorized(),
            match(appState.uncategorizedGoalAmount).with(null, () => null).otherwise(v => { return { value: v, currency: appState.uncategorizedGoalCurrency } })
        ))
        .otherwise(() => new ExpensesStats(
            Operations.forFilter(appState.filter).keepTypes('expense', 'income').keepCategories(cat.name).skipUncategorized(),
            match(newCat.perDayAmount).with(undefined, () => null).otherwise(v => { return { value: -v, currency: newCat.currency ?? '' } })
        ))

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    const goal = stats.goal(30)

    return <>
        <Column height='100%'>
            <Box p={1}>
                <Typography variant='h6' textAlign='center' mt={1}>
                    {newCat.name.trim() === '' ? '-' : newCat.name}
                </Typography>
                <Typography variant='h6' textAlign='center' color='primary.main' mb={1}>
                    {cur(-stats.amountTotal(appState.timeSpan, currency))}
                </Typography>
                <Typography variant='body2' textAlign='center'>
                    Goal (30d): {goal !== null ? cur(-goal.value * currenciesModel.getRate(utcToday(), goal.currency, currency)) : '-'}
                </Typography>
                <Tabs value={tabName} onChange={(_, tab) => { navigate(`/categories/${catName}/${tab as string}`) }} variant='fullWidth'>
                    <Tab value='stats' label='Stats'/>
                    <Tab value='modify' label='Modify'/>
                    <Tab value='operations' label='Operations'/>
                </Tabs>
            </Box>
            <Box overflow='scroll' flex='1 1 auto'>
                <Box px={1}>
                    {
                        match(tabName)
                            .with('stats', () => <ExpensesStatsWidget currency={currency} stats={stats} />)
                            .with('modify', () => <CategoryEditor
                                origCatName={cat.name}
                                cat={newCat}
                                onChange={setNewCat}
                            />)
                            .with('operations', () => <OpsList
                                noFab
                                onOpClick={(opId) => {
                                    navigate(`/categories/${catName}/operations/${opId}`)
                                }}
                                operations={stats.operations.forTimeSpan(appState.timeSpan)}
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
                    title={opModalTitle}
                    onClose={() => { navigate(`/categories/${catName}/operations`) }}
                    onSave={opModalOnSave}
                >
                    <Box p={1}>
                        <OperationScreenBody
                            opId={opId ?? ''}
                            setTitle={setOpModalTitle}
                            setOnSave={(onSave) => {
                                if (onSave === null || onSave === undefined) {
                                    setOpModalOnSave(onSave)
                                    return
                                }

                                setOpModalOnSave(() => {
                                    return onSave
                                })
                            }}
                        />
                    </Box>
                </FullScreenModal>
            })
        }
    </>
})
CategoryScreenBody.displayName = 'CategoryScreenBody'
