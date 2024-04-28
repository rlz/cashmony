import { Box } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'

import { runAsync } from '../../helpers/smallTools'
import { AppState } from '../../model/appState'
import { CategoriesModel } from '../../model/categories'
import { GoalsModel } from '../../model/goals'
import { type Category, type ExpensesGoal } from '../../model/model'
import { calcStats2 } from '../../model/newStatsProcessor'
import { OperationsModel } from '../../model/operations'
import { EXPENSE_PREDICATE, PE } from '../../model/predicateExpression'
import { TotalAndChangeStats } from '../../model/stats/data'
import { TotalAndChangeReducer } from '../../model/stats/TotalAndChangeReducer'
import { ExpensesCard, ExpensesCardSkeleton } from './ExpensesCard'

interface ExpensesListProps {
    categories?: readonly Category[]
    goals?: readonly ExpensesGoal[]
}

export const ExpensesList = observer(({ categories, goals }: ExpensesListProps): ReactElement => {
    const appState = AppState.instance()
    const operationsModel = OperationsModel.instance()
    const categoriesModel = CategoriesModel.instance()
    const goalsModel = GoalsModel.instance()

    const [stats, setStats] = useState<Record<string, TotalAndChangeStats> | null>(null)

    useEffect(
        () => {
            if (
                operationsModel.operations === null
                || categoriesModel.categories === null
                || goalsModel.goals === null
            ) {
                return
            }

            runAsync(async () => {
                const reducers = categories !== undefined
                    ? Object.fromEntries(
                        categories.map(c => [
                            c.name,
                            new TotalAndChangeReducer(PE.cat(c.name), c.currency ?? appState.masterCurrency, true)
                        ])
                    )
                    : Object.fromEntries(
                        (goals ?? []).map(g => [
                            g.name,
                            new TotalAndChangeReducer(PE.and(EXPENSE_PREDICATE, PE.filter(g.filter)), g.currency, true)
                        ])
                    )
                await calcStats2(
                    PE.any(),
                    appState.timeSpan,
                    appState.today,
                    Object.values(reducers)
                )

                setStats(Object.fromEntries(Object.entries(reducers).map(([n, r]) => [n, r.stats])))
            })
        },
        [
            categories,
            goals,
            appState.masterCurrency,
            appState.today,
            appState.timeSpanInfo,
            operationsModel.operations,
            categoriesModel.categories,
            goalsModel.goals
        ]
    )

    if (stats === null) {
        return (
            <Box
                display={'flex'}
                flexDirection={'column'}
                gap={1}
            >
                {[1, 1, 1].map((_, i) => <ExpensesCardSkeleton key={i} />)}
            </Box>
        )
    }

    return (
        <Box
            display={'flex'}
            flexDirection={'column'}
            gap={1}
        >
            {
            categories === undefined
                ? (goals ?? []).map((goal) => {
                        const url = `/goals/${encodeURIComponent(goal.name)}`
                        return (
                            <ExpensesCard
                                key={goal.name}
                                url={url}
                                name={goal.name}
                                perDayGoal={goal.perDayAmount}
                                stats={stats[goal.name]}
                                currency={goal.currency ?? appState.masterCurrency}
                            />
                        )
                    })
                : categories.map((cat) => {
                    const url = `/categories/${encodeURIComponent(cat.name)}`
                    return (
                        <ExpensesCard
                            key={cat.name}
                            url={url}
                            name={cat.name}
                            perDayGoal={cat.perDayAmount ?? null}
                            stats={stats[cat.name]}
                            currency={cat.currency ?? appState.masterCurrency}
                        />
                    )
                })
        }
        </Box>
    )
})
