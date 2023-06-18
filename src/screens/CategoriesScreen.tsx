import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement } from 'react'
import { MainScreen } from '../widgets/MainScreen'
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

const appState = AppState.instance()
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
                stats={new ExpensesStats(Operations.all(), null)}
                currency={appState.masterCurrency}
            />
            {
                (showHidden ? [...visibleCategories, ...hiddenCategories] : visibleCategories)
                    .map(cat => {
                        const stats = ExpensesStats.forCat(cat.name)

                        return <CategoryCard key={cat.name} name={cat.name} currency={cat.currency} stats={stats}/>
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
                    const stats = new ExpensesStats(Operations.all().onlyUncategorized(), null)
                    return showIf(
                        stats.operations.count() > 0,
                        <CategoryCard
                            name={null}
                            stats={stats}
                            currency={appState.masterCurrency}
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
    currency: string
    stats: ExpensesStats
}

const CategoryCard = observer((props: CategoryCardProps): ReactElement => {
    const navigate = useNavigate()

    const goal30 = props.stats.goal(30)
    const leftPerDay = match(props.stats.leftPerDay(appState.timeSpan, props.currency))
        .with(null, () => 0)
        .with(P.number.negative(), v => -v)
        .otherwise(() => 0)

    const cur = (amount: number, compact = false): string => formatCurrency(amount, props.currency, compact)

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
                    {cur(-props.stats.amountTotal(appState.timeSpan, props.currency))}
                </Typography>
            </Box>
            <Typography component="div" variant='body2' my={1}>
                <table className="stats">
                    <tbody>
                        <tr>
                            <th>Goal (30d):</th>
                            <td>{goal30 !== null ? cur(-goal30) : '-'}</td>
                        </tr>
                        <tr>
                            <th>Period Pace (30d):</th>
                            <td>{cur(-props.stats.avgUntilToday(30, appState.timeSpan, props.currency))}</td>
                        </tr>
                        <tr>
                            <th>Left per day:</th>
                            <td>{ leftPerDay > 0 ? cur(leftPerDay) : '-' }</td>
                        </tr>
                    </tbody>
                </table>
            </Typography>
            <ExpensesBarsPlot currency={props.currency} sparkline stats={props.stats} />
        </Paper>
    </a>
})
