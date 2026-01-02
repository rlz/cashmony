import { Box, Grid, Paper, Stack } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { JSX, useEffect, useState } from 'react'

import { EXPENSE_PREDICATE, INCOME_PREDICATE, Predicate } from '../../engine/predicateExpression.js'
import { calcStats } from '../../engine/stats/stats.js'
import { TotalAndChangeReducer } from '../../engine/stats/TotalAndChangeReducer.js'
import { YearsComparisonReducer } from '../../engine/stats/YearsComparisonReducer.js'
import { YMComparisonReducer } from '../../engine/stats/YMComparisonReducer.js'
import { formatCurrency } from '../helpers/currencies.js'
import { useFrontState } from '../model/FrontState.js'
import { useCurrenciesLoader } from '../useCurrenciesLoader.js'
import { useEngine } from '../useEngine.js'
import { TotalAndChangePlot } from './plots/TotalAndChangePlot.js'
import { YearExpenseIncomeComparisonPlot } from './plots/YearExpenseIncomeComparisonPlot.js'
import { YMExpensesComparisonPlot } from './plots/YMComparisonPlot.js'

interface Props {
    predicate: Predicate
}

interface Reducers {
    expense: TotalAndChangeReducer
    income: TotalAndChangeReducer
    ym: YMComparisonReducer
    years: YearsComparisonReducer
}

export const AnaliticsScreenStats = observer(function AnaliticsScreenStats({ predicate }: Props): JSX.Element {
    const engine = useEngine()
    const currenciesLoader = useCurrenciesLoader()
    const appState = useFrontState()
    const [reducers, setReducers] = useState<Reducers | null>(null)

    useEffect(() => {
        void (
            async () => {
                const ts = appState.timeSpan
                const today = appState.today
                const reducers: Reducers = {
                    expense: new TotalAndChangeReducer(engine, currenciesLoader, today, ts, EXPENSE_PREDICATE, appState.masterCurrency),
                    income: new TotalAndChangeReducer(engine, currenciesLoader, today, ts, INCOME_PREDICATE, appState.masterCurrency),
                    ym: new YMComparisonReducer(currenciesLoader, appState.masterCurrency),
                    years: new YearsComparisonReducer(currenciesLoader, appState.masterCurrency)
                }
                await calcStats(engine, predicate, ts, appState.today, Object.values(reducers))
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
                        <Grid size={12}>
                            <Paper variant={'outlined'}>
                                <Stack direction={'row'} p={1} spacing={1}>
                                    <Box>
                                        {'Income: '}
                                        {formatCurrency(reducers.income.stats.total, appState.masterCurrency)}
                                    </Box>
                                    <Box>
                                        {'Expense: '}
                                        {formatCurrency(-reducers.expense.stats.total, appState.masterCurrency)}
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TotalAndChangePlot
                                title={'Expense'}
                                expense
                                stats={reducers.expense.stats}
                                currency={appState.masterCurrency}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TotalAndChangePlot
                                title={'Income'}
                                stats={reducers.income.stats}
                                currency={appState.masterCurrency}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <YMExpensesComparisonPlot
                                title={'Y/M Expenses Comparison'}
                                stats={reducers.ym.expenses}
                                currency={appState.masterCurrency}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <YMExpensesComparisonPlot
                                title={'Y/M Incomes Comparison'}
                                stats={reducers.ym.incomes}
                                currency={appState.masterCurrency}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
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
