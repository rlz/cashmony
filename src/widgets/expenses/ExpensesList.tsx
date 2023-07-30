import { Box } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { match } from 'ts-pattern'

import { runAsync } from '../../helpers/smallTools'
import { AppState } from '../../model/appState'
import { CategoriesModel } from '../../model/categories'
import { CurrenciesModel } from '../../model/currencies'
import { GoalsModel } from '../../model/goals'
import { type Category, type ExpensesGoal } from '../../model/model'
import { OperationsModel } from '../../model/operations'
import { PE } from '../../model/predicateExpression'
import { calcStats } from '../../model/stats'
import { perCatTodayExpensesReducer, perPredicatePerIntervalSumExpenses, perPredicateTodaySumExpenses, type PredicateWithCurrency, sumCatExpensesReducer } from '../../model/statsReducers'
import { Bold, Italic } from '../generic/Typography'
import { ExpensesCard, ExpensesCardSkeleton } from './ExpensesCard'

interface ExpensesListProps {
    categories?: readonly Category[]
    goals?: readonly ExpensesGoal[]
}

export const ExpensesList = observer(({ categories, goals }: ExpensesListProps): ReactElement => {
    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    const operationsModel = OperationsModel.instance()
    const categoriesModel = CategoriesModel.instance()
    const goalsModel = GoalsModel.instance()

    const [stats, setStats] = useState<{ totals: Record<string, number>, today: Record<string, number>, perDayExpenses: Array<Record<string, number>> } | null>(null)

    useEffect(
        () => {
            if (
                currenciesModel.rates === null ||
                operationsModel.operations === null ||
                categoriesModel.categories === null ||
                goalsModel.goals === null
            ) {
                return
            }

            runAsync(async () => {
                if (categories !== undefined) {
                    const stats = await calcStats(PE.any(), appState.timeSpan, appState.today, {
                        totals: sumCatExpensesReducer(
                            null,
                            appState.totalGoalAmount === null ? appState.masterCurrency : appState.totalGoalCurrency,
                            appState.uncategorizedGoalAmount === null ? appState.masterCurrency : appState.uncategorizedGoalCurrency
                        ),
                        today: perCatTodayExpensesReducer(
                            appState.totalGoalAmount === null ? appState.masterCurrency : appState.totalGoalCurrency,
                            appState.uncategorizedGoalAmount === null ? appState.masterCurrency : appState.uncategorizedGoalCurrency
                        ),
                        perDayExpenses: sumCatExpensesReducer(
                            'day',
                            appState.totalGoalAmount === null ? appState.masterCurrency : appState.totalGoalCurrency,
                            appState.uncategorizedGoalAmount === null ? appState.masterCurrency : appState.uncategorizedGoalCurrency
                        )
                    })

                    setStats({
                        totals: stats.totals[0],
                        today: stats.today[0],
                        perDayExpenses: stats.perDayExpenses
                    })
                }

                if (goals !== undefined) {
                    const predicatesWithCurrency: Record<string, PredicateWithCurrency> = {}
                    goals.forEach(i => {
                        predicatesWithCurrency[i.name] = { currency: i.currency, predicate: PE.filter(i.filter) }
                    })

                    const stats = await calcStats(PE.any(), appState.timeSpan, appState.today, {
                        totals: perPredicatePerIntervalSumExpenses(null, predicatesWithCurrency),
                        perDayExpenses: perPredicatePerIntervalSumExpenses('day', predicatesWithCurrency),
                        today: perPredicateTodaySumExpenses(predicatesWithCurrency)
                    })

                    setStats({
                        totals: stats.totals[0],
                        today: stats.today[0],
                        perDayExpenses: stats.perDayExpenses
                    })
                }
            })
        },
        [
            categories,
            goals,
            appState.masterCurrency,
            appState.totalGoalAmount,
            appState.totalGoalCurrency,
            appState.uncategorizedGoalAmount,
            appState.uncategorizedGoalCurrency,
            appState.today,
            appState.timeSpanInfo,
            currenciesModel.rates,
            operationsModel.operations,
            categoriesModel.categories,
            goalsModel.goals
        ]
    )

    if (stats === null) {
        return <Box
            display={'flex'}
            flexDirection={'column'}
            gap={1}
        >
            {[1, 1, 1].map((_, i) => <ExpensesCardSkeleton key={i} />)}
        </Box>
    }

    return <Box
        display={'flex'}
        flexDirection={'column'}
        gap={1}
    >
        {
            categories === undefined
                ? (goals ?? []).map(goal => {
                    const url = `/goals/${encodeURIComponent(goal.name)}`
                    return <ExpensesCard
                        key={goal.name}
                        url={url}
                        name={
                            match(goal.name)
                                .with('_total', () => <Bold>{'Total'}</Bold>)
                                .with('_', () => <Italic>{'Uncategorized'}</Italic>)
                                .otherwise(v => v)
                        }
                        totalAmount={stats.totals[goal.name]}
                        todayAmount={stats.today[goal.name]}
                        perDayGoal={goal.perDayAmount ?? null}
                        perDayExpenses={stats.perDayExpenses.map(i => i[goal.name])}
                        currency={goal.currency ?? appState.masterCurrency}
                    />
                })
                : categories.map(cat => {
                    const url = `/categories/${encodeURIComponent(cat.name)}`
                    return <ExpensesCard
                        key={cat.name}
                        url={url}
                        name={
                            match(cat.name)
                                .with('_total', () => <Bold>{'Total'}</Bold>)
                                .with('_', () => <Italic>{'Uncategorized'}</Italic>)
                                .otherwise(v => v)
                        }
                        totalAmount={stats.totals[cat.name]}
                        todayAmount={stats.today[cat.name]}
                        perDayGoal={cat.perDayAmount ?? null}
                        perDayExpenses={stats.perDayExpenses.map(i => i[cat.name])}
                        currency={cat.currency ?? appState.masterCurrency}
                    />
                })
        }
    </Box>
})
