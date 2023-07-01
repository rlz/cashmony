import React, { type ReactElement } from 'react'
import { type Category, type ExpensesGoal } from '../../model/model'
import { Box } from '@mui/material'
import { match } from 'ts-pattern'
import { ExpensesStats, Operations } from '../../model/stats'
import { AppState } from '../../model/appState'
import { CurrenciesModel } from '../../model/currencies'
import { observer } from 'mobx-react-lite'
import { ExpensesCard, ExpensesCardSkeleton } from './ExpensesCard'

interface ExpensesListProps {
    items: ReadonlyArray<Category | ExpensesGoal> | null
}

export const ExpensesList = observer(({ items }: ExpensesListProps): ReactElement => {
    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()

    return <Box
        display='flex'
        flexDirection='column'
        gap={1}
    >
        {
            items === null || currenciesModel.rates === null
                ? [1, 1, 1].map((_, i) => <ExpensesCardSkeleton key={i} />)
                : items.map(cat => {
                    const url = match(cat)
                        .with({ filter: {} }, v => `/goals/${encodeURIComponent(v.name)}`)
                        .otherwise(v => `/categories/${encodeURIComponent(v.name)}`)
                    const stats = match(cat)
                        .with({ filter: {} }, v => new ExpensesStats(
                            Operations.forFilter(v.filter),
                            { value: -v.perDayAmount, currency: v.currency }
                        ))
                        .otherwise(v => new ExpensesStats(
                            Operations.forFilter(appState.filter).keepCategories(cat.name),
                            v.perDayAmount !== undefined ? { value: -v.perDayAmount, currency: v.currency ?? '' } : null
                        ))
                    return <ExpensesCard url={url} key={cat.name} name={cat.name} stats={stats}/>
                })
        }
    </Box>
})
