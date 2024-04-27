import { Box, Grid } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import { AppState } from '../model/appState'
import { calcStats2 } from '../model/newStatsProcessor'
import { EXPENSE_PREDICATE, INCOME_PREDICATE, Predicate } from '../model/predicateExpression'
import { TotalAndChangeReducer } from '../model/stats/TotalAndChangeReducer'
import { YearsComparisonReducer } from '../model/stats/YearsComparisonReducer'
import { YMComparisonReducer } from '../model/stats/YMComparisonReducer'
import { TotalAndChangePlot } from './plots/TotalAndChangePlot'
import { YearExpenseIncomeComparisonPlot } from './plots/YearExpenseIncomeComparisonPlot'
import { YMExpensesComparisonPlot } from './plots/YMComparisonPlot'

interface Props {
    predicate: Predicate
}

interface Redusers {
    expense: TotalAndChangeReducer
    income: TotalAndChangeReducer
    ym: YMComparisonReducer
    years: YearsComparisonReducer
}

export const AnaliticsScreenStats = observer(function AnaliticsScreenStats({ predicate }: Props): JSX.Element {
    const appState = AppState.instance()
    const [reducers, setReducers] = useState<Redusers | null>(null)

    useEffect(() => {
        void (
            async () => {
                const reducers: Redusers = {
                    expense: new TotalAndChangeReducer(EXPENSE_PREDICATE, appState.masterCurrency, true),
                    income: new TotalAndChangeReducer(INCOME_PREDICATE, appState.masterCurrency),
                    ym: new YMComparisonReducer(appState.masterCurrency),
                    years: new YearsComparisonReducer(appState.masterCurrency)
                }
                await calcStats2(predicate, appState.timeSpan, appState.today, Object.values(reducers))
                setReducers(reducers)
            }
        )()
    }, [predicate, appState.timeSpan, appState.today, appState.masterCurrency])

    return (
        <Box>
            {
                reducers !== null
                && (
                    <Grid container spacing={1} my={1}>
                        <Grid item xs={12} sm={6}>
                            <TotalAndChangePlot
                                title={'Expense'}
                                expense
                                stats={reducers.expense.stats}
                                currency={appState.masterCurrency}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TotalAndChangePlot
                                title={'Income'}
                                stats={reducers.income.stats}
                                currency={appState.masterCurrency}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <YMExpensesComparisonPlot
                                title={'Y/M Expenses Comparison'}
                                stats={reducers.ym.expenses}
                                currency={appState.masterCurrency}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <YMExpensesComparisonPlot
                                title={'Y/M Incomes Comparison'}
                                stats={reducers.ym.incomes}
                                currency={appState.masterCurrency}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <YearExpenseIncomeComparisonPlot
                                incomes={reducers.years.incomes}
                                expenses={reducers.years.expenses}
                                currency={appState.masterCurrency}
                            />
                        </Grid>
                    </Grid>
                )
            }
        </Box>
    )
})
