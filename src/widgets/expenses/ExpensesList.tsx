import { Box } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { match } from 'ts-pattern'

import { AppState } from '../../model/appState'
import { CurrenciesModel } from '../../model/currencies'
import { type Category, type ExpensesGoal } from '../../model/model'
import { PE } from '../../model/predicateExpression'
import { ExpensesStats, Operations } from '../../model/stats'
import { ExpensesCard, ExpensesCardSkeleton } from './ExpensesCard'

interface ExpensesListProps {
    items: ReadonlyArray<Category | ExpensesGoal> | null
}

export const ExpensesList = observer(({ items }: ExpensesListProps): ReactElement => {
    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()

    return <Box
        display={'flex'}
        flexDirection={'column'}
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
                            Operations.get(PE.filter(v.filter)),
                            { value: -v.perDayAmount, currency: v.currency }
                        ))
                        .otherwise(v => new ExpensesStats(
                            Operations.get(PE.and(PE.cat(cat.name), PE.filter(appState.filter))),
                            v.perDayAmount !== undefined ? { value: -v.perDayAmount, currency: v.currency ?? '' } : null
                        ))
                    return <ExpensesCard url={url} key={cat.name} name={cat.name} stats={stats}/>
                })
        }
    </Box>
})
