import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement } from 'react'
import { Box, Fab, Paper, Typography } from '@mui/material'
import { CategoriesModel } from '../model/categories'
import 'uplot/dist/uPlot.min.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { ExpensesStats, Operations } from '../model/stats'
import { type Category } from '../model/model'
import { AddCategory } from '../widgets/AddCategory'
import { formatCurrency } from '../helpers/currencies'
import './CategoriesScreen.scss'
import { ExpensesBarsPlot } from '../widgets/ExpensesPlots'
import { AppState } from '../model/appState'
import { P, match } from 'ts-pattern'
import { run, showIf } from '../helpers/smallTools'
import { CurrenciesModel } from '../model/currencies'
import { utcToday } from '../helpers/dates'
import { MainScreen } from '../widgets/mainScreen/MainScreen'

const appState = AppState.instance()
const currenciesModel = CurrenciesModel.instance()
const categoriesModel = CategoriesModel.instance()

export const CategoriesScreen = observer((): ReactElement => {
    const [showHidden, setShowHidden] = useState(false)
    const [addCategory, setAddCategory] = useState(false)

    const visibleCategories: Category[] = []
    const hiddenCategories: Category[] = []

    for (const c of categoriesModel.categoriesSorted.map(c => categoriesModel.get(c))) {
        if (c.deleted === true) continue
        if (c.hidden) {
            hiddenCategories.push(c)
            continue
        }
        visibleCategories.push(c)
    }

    return <MainScreen>
        {
            match(addCategory)
                .with(
                    true, () => <AddCategory
                        onClose={() => { setAddCategory(false) }}
                    />
                )
                .otherwise(
                    () => <Fab
                        color="primary"
                        sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                        onClick={() => { setAddCategory(true) }}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </Fab>
                )
        }
        <Box
            display="flex"
            flexDirection="column"
            gap={1}
        >
            <CategoryCard
                name='_total'
                stats={new ExpensesStats(Operations.forFilter(appState.filter), null)}
            />
            {
                (showHidden ? [...visibleCategories, ...hiddenCategories] : visibleCategories)
                    .map(cat => {
                        const stats = new ExpensesStats(Operations.forFilter(appState.filter).keepCategories(cat.name), cat.yearGoalUsd ?? null)

                        return <CategoryCard key={cat.name} name={cat.name} stats={stats}/>
                    })
            }
            {
                !showHidden && hiddenCategories.length > 0
                    ? <Typography color="primary.main" textAlign="center">
                        <a onClick={() => { setShowHidden(true) }}>Show {hiddenCategories.length} hidden</a>
                    </Typography>
                    : null
            }
            {
                run(() => {
                    const stats = new ExpensesStats(Operations.forFilter(appState.filter).onlyUncategorized(), null)
                    return showIf(
                        stats.operations.count() > 0,
                        <CategoryCard
                            name={null}
                            stats={stats}
                        />
                    )
                })
            }
        </Box>
        <Box minHeight={144}/>
    </MainScreen>
})

interface CategoryCardProps {
    name: string | null
    stats: ExpensesStats
}

const CategoryCard = observer((props: CategoryCardProps): ReactElement => {
    const navigate = useNavigate()

    const currency = appState.masterCurrency

    const goalUsd30 = props.stats.goalUsd(30)
    const leftPerDay = match(props.stats.leftPerDay(appState.timeSpan, currency))
        .with(null, () => 0)
        .with(P.number.negative(), v => -v)
        .otherwise(() => 0)

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    return <a onClick={() => { navigate(`/categories/${encodeURIComponent(props.name ?? '_')}`) }}>
        <Paper sx={{ p: 1 }}>
            <Box display="flex" gap={1}>
                <Typography component="div" variant='body1'>
                    {
                        match(props.name)
                            .with('_total', () => <Typography fontWeight='bold'>Total</Typography>)
                            .with(null, () => <Typography fontStyle='italic'>Uncategorized</Typography>)
                            .otherwise(v => v)
                    }
                </Typography>
                <Typography
                    variant='body1'
                    color='primary.main'
                    flex='1 1 0'
                    textAlign='right'
                >
                    {cur(match(props.stats.amountTotal(appState.timeSpan, currency)).with(0, v => v).otherwise(v => -v))}
                </Typography>
            </Box>
            <Typography component="div" variant='body2' my={1}>
                <table className="stats">
                    <tbody>
                        <tr>
                            <th>Goal (30d):</th>
                            <td>{goalUsd30 !== null ? cur(-goalUsd30 * currenciesModel.getFromUsdRate(utcToday(), currency)) : '-'}</td>
                        </tr>
                        <tr>
                            <th>Period Pace (30d):</th>
                            <td>{cur(-props.stats.avgUntilToday(30, appState.timeSpan, currency))}</td>
                        </tr>
                        <tr>
                            <th>Left per day:</th>
                            <td>{ leftPerDay > 0 ? cur(leftPerDay) : '-' }</td>
                        </tr>
                    </tbody>
                </table>
            </Typography>
            <ExpensesBarsPlot currency={currency} sparkline stats={props.stats} />
        </Paper>
    </a>
})
