import { Box } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'

import { type Category, type Watch } from '../../../engine/model'
import { EXPENSE_PREDICATE, PE } from '../../../engine/predicateExpression'
import { TotalAndChangeStats } from '../../../engine/stats/model'
import { calcStats2 } from '../../../engine/stats/newStatsProcessor'
import { TotalAndChangeReducer } from '../../../engine/stats/TotalAndChangeReducer'
import { runAsync } from '../../helpers/smallTools'
import { useAppState } from '../../model/AppState'
import { useCurrenciesLoader } from '../../useCurrenciesLoader'
import { useEngine } from '../../useEngine'
import { ExpensesCard, ExpensesCardSkeleton } from './ExpensesCard'

interface ExpensesListProps {
    categories?: readonly Category[]
    goals?: readonly Watch[]
}

export const ExpensesList = observer(({ categories, goals }: ExpensesListProps): ReactElement => {
    const engine = useEngine()
    const appState = useAppState()
    const currenciesLoader = useCurrenciesLoader()

    const [stats, setStats] = useState<Record<string, TotalAndChangeStats> | null>(null)

    useEffect(
        () => {
            setStats(null)
            runAsync(async () => {
                const ts = appState.timeSpan
                const reducers = categories !== undefined
                    ? Object.fromEntries(
                        categories.map(c => [
                            c.id,
                            new TotalAndChangeReducer(engine, currenciesLoader, ts, PE.cat(c.id), c.currency ?? appState.masterCurrency, true)
                        ])
                    )
                    : Object.fromEntries(
                        (goals ?? []).map(g => [
                            g.id,
                            new TotalAndChangeReducer(engine, currenciesLoader, ts, PE.and(EXPENSE_PREDICATE, PE.filter(g.filter)), g.currency, true)
                        ])
                    )
                await calcStats2(
                    engine,
                    PE.any(),
                    ts,
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
            engine.operations
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
                    ? ([...(goals ?? [])].sort((g1, g2) => g1.name.localeCompare(g2.name))).map((goal) => {
                            const url = `/goals/${encodeURIComponent(goal.id)}`
                            return (
                                <ExpensesCard
                                    key={goal.name}
                                    url={url}
                                    name={goal.name}
                                    perDayGoal={goal.perDayAmount}
                                    stats={stats[goal.id]}
                                    currency={goal.currency ?? appState.masterCurrency}
                                />
                            )
                        })
                    : categories.map((cat) => {
                        const url = `/categories/${encodeURIComponent(cat.id)}`
                        return (
                            <ExpensesCard
                                key={cat.name}
                                url={url}
                                name={cat.name}
                                perDayGoal={cat.perDayAmount ?? null}
                                stats={stats[cat.id]}
                                currency={cat.currency ?? appState.masterCurrency}
                            />
                        )
                    })
            }
        </Box>
    )
})
