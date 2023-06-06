import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement } from 'react'
import { MainScreen } from '../widgets/MainScreen'
import { Box, Fab, Paper, Typography } from '@mui/material'
import { CategoriesModel } from '../model/categories'
import 'uplot/dist/uPlot.min.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { CategoryStats } from '../model/stats'
import { type Category } from '../model/model'
import { AddCategory } from '../widgets/AddCategory'
import { formatCurrency } from '../helpers/currencies'
import './CategoriesScreen.scss'
import { AmountBarsCatPlot } from '../widgets/CategoryPlots'

const categoriesModel = CategoriesModel.instance()

export const CategoriesScreen = observer((): ReactElement => {
    const navigate = useNavigate()
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
            addCategory
                ? <AddCategory
                    onClose={() => { setAddCategory(false) }}
                />
                : <Fab
                    color="primary"
                    sx={{ position: 'fixed', bottom: '70px', right: '20px' }}
                    onClick={() => { setAddCategory(true) }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                </Fab>

        }
        <Box
            display="flex"
            flexDirection="column"
            gap={1}
            p={1}
        >
            {
                (showHidden ? [...visibleCategories, ...hiddenCategories] : visibleCategories)
                    .map(cat => {
                        const stats = CategoryStats.for(cat.name)
                        const goal30 = stats.goal(30)
                        const leftPerDay = stats.daysLeft() > 0 && stats.category.yearGoal !== null
                            ? -(stats.leftPerDay() ?? -0)
                            : -1

                        const cur = (amount: number, compact = false): string => formatCurrency(amount, cat.currency, compact)

                        return <a key={cat.name} onClick={() => { navigate(`/categories/${encodeURIComponent(cat.name)}`) }}>
                            <Paper sx={{ p: 1 }} >
                                <Box display="flex" gap={1}>
                                    <Typography variant='body1'>
                                        {cat.name}
                                    </Typography>
                                    <Typography
                                        variant='body1'
                                        color='primary.main'
                                        flex='1 1 0'
                                        textAlign='right'
                                    >
                                        {cur(-stats.amountTotal())}
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
                                                <td>{cur(-stats.avgUntilToday(30))}</td>
                                            </tr>
                                            <tr>
                                                <th>Left per day:</th>
                                                <td>{ leftPerDay > 0 ? cur(leftPerDay) : '-' }</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </Typography>
                                <AmountBarsCatPlot sparkline stats={stats} />
                            </Paper>
                        </a>
                    })
            }
            {
                !showHidden && hiddenCategories.length > 0
                    ? <Typography color="primary.main" textAlign="center">
                        <a onClick={() => { setShowHidden(true) }}>Show {hiddenCategories.length} hidden</a>
                    </Typography>
                    : null
            }
        </Box>
        <Box minHeight={144}/>
    </MainScreen>
})
