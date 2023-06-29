import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement, useEffect } from 'react'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import { CategoriesModel } from '../model/categories'
import { useNavigate, useParams } from 'react-router-dom'
import { type Operation, type Category } from '../model/model'
import { OperationsModel } from '../model/operations'
import { deepEqual } from '../helpers/deepEqual'
import { DateTime } from 'luxon'
import { ExpensesStats, Operations } from '../model/stats'
import { formatCurrency } from '../helpers/currencies'
import { OpsList } from '../widgets/operations/OpsList'
import { AppState } from '../model/appState'
import { nonNull, run } from '../helpers/smallTools'
import { match } from 'ts-pattern'
import { runInAction } from 'mobx'
import { CurrenciesModel } from '../model/currencies'
import { utcToday } from '../helpers/dates'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { ExpensesGroupScreenSkeleton } from '../widgets/expenses/ExpensesGroupScreenSkeleton'
import { ExpensesStatsWidget } from '../widgets/expenses/ExpensesStatsWidget'
import { CategoryEditor } from '../widgets/expenses/editors/CategoryEditor'

export const CategoryScreen = observer((): ReactElement => {
    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    const categoriesModel = CategoriesModel.instance()
    const operationsModel = OperationsModel.instance()

    const catName = nonNull(useParams().catName, 'catName expected here')

    const [cat, setCat] = useState<Category | null>(null)
    const [newCat, setNewCat] = useState<Category | null>(null)
    const [tab, setTab] = useState(0)
    const navigate = useNavigate()

    const currency = newCat?.currency ?? appState.masterCurrency

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
                            .with('_', () => appState.uncategorizedGoalUsd ?? undefined)
                            .with('_total', () => appState.totalGoalUsd ?? undefined)
                            .exhaustive()
                        return v !== undefined ? -v / 365 : 0
                    }),
                    currency: 'USD'
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
            categoriesModel.categories,
            appState.masterCurrency,
            appState.totalGoalUsd,
            appState.uncategorizedGoalUsd
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
            match(appState.totalGoalUsd).with(null, () => null).otherwise(v => { return { value: v / 365, currency: 'USD' } })
        ))
        .with('_', () => new ExpensesStats(
            Operations.forFilter(appState.filter).onlyUncategorized(),
            match(appState.uncategorizedGoalUsd).with(null, () => null).otherwise(v => { return { value: v / 365, currency: 'USD' } })
        ))
        .otherwise(() => new ExpensesStats(
            Operations.forFilter(appState.filter).keepTypes('expense', 'income').keepCategories(cat.name),
            match(newCat.perDayAmount).with(undefined, () => null).otherwise(v => { return { value: -v, currency: newCat.currency ?? '' } })
        ))

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    const onSave = run(() => {
        if (
            deepEqual(cat, newCat) ||
            newCat.name.trim() === '' ||
            (
                newCat.name !== cat.name &&
                categoriesModel.categories.has(newCat.name) &&
                categoriesModel.get(newCat.name).deleted !== true
            )
        ) {
            return null
        }

        return async () => {
            if (catName === '_') {
                runInAction(() => {
                    appState.uncategorizedGoalUsd = newCat.perDayAmount === undefined ? null : -newCat.perDayAmount * 365
                })
            } else if (catName === '_total') {
                runInAction(() => {
                    appState.totalGoalUsd = newCat.perDayAmount === undefined ? null : -newCat.perDayAmount * 365
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
        }
    })

    const goal = stats.goal(30)

    return <MainScreen
        navigateOnBack='/categories'
        title="Category"
        onSave={onSave}
    >
        <Box p={1}>
            <Typography variant='h6' textAlign="center" mt={1}>
                {newCat.name.trim() === '' ? '-' : newCat.name}
            </Typography>
            <Typography variant='h6' textAlign="center" color='primary.main' mb={1}>
                {cur(-stats.amountTotal(appState.timeSpan, currency))}
            </Typography>
            <Typography variant='body2' textAlign="center">
            Goal (30d): {goal !== null ? cur(-goal.value * currenciesModel.getRate(utcToday(), goal.currency, currency)) : '-'}
            </Typography>
            <Tabs value={tab} onChange={(_, tab) => { setTab(tab) }} variant='fullWidth'>
                <Tab label="Stats"/>
                <Tab label="Modify"/>
                <Tab label="Operations"/>
            </Tabs>
        </Box>
        <Box overflow="scroll">
            <Box px={1}>
                {
                    match(tab)
                        .with(0, () => <ExpensesStatsWidget currency={currency} stats={stats} />)
                        .with(1, () => <CategoryEditor
                            origCatName={cat.name}
                            cat={newCat}
                            onChange={setNewCat}
                        />)
                        .with(2, () => <OpsList
                            operations={stats.operations.forTimeSpan(appState.timeSpan)}
                        />)
                        .otherwise(() => { throw Error('Unimplenented tab') })
                }
                <Box minHeight={72}/>
            </Box>
        </Box>
    </MainScreen>
})
