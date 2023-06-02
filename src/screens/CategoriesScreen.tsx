import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { MainScreen } from '../widgets/MainScreen'
import { Box, Fab, Paper, Typography } from '@mui/material'
import { formatCurrency } from '../helpers/currencies'
import { CategoriesModel } from '../model/categories'
import 'uplot/dist/uPlot.min.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { CatMonthStats } from '../model/stats'
import { Sparkline } from '../widgets/Sparkline'

const categoriesModel = CategoriesModel.instance()

export const CategoriesScreen = observer((): ReactElement => {
    const navigate = useNavigate()

    return <MainScreen>
        <Fab color="primary" sx={{ position: 'absolute', bottom: '70px', right: '20px' }}>
            <FontAwesomeIcon icon={faPlus} />
        </Fab>
        <Box
            display="flex"
            flexDirection="column"
            gap={1}
            p={1}
        >
            { categoriesModel.categoriesSorted.map(c => categoriesModel.get(c)).map(cat => {
                const stats = CatMonthStats.for(cat.name)

                return <a key={cat.name} onClick={() => { navigate(`/categories/${encodeURIComponent(cat.name)}`) }}>
                    <Paper sx={{ p: 1 }} >
                        <Box display="flex" gap={1} mb={1}>
                            <Box>
                                <Typography variant='body1'>
                                    {cat.name}
                                </Typography>
                                {
                                    cat.yearGoal !== undefined
                                        ? <Typography variant='body2'>
                                            Goal: <Amount value={cat.yearGoal / 12} currency={cat.currency}/>
                                        </Typography>
                                        : null
                                }
                            </Box>
                            <Typography flex="1 0 0" variant='body2' textAlign="right">
                                This month:<br/>
                                Last 30 d.:<br/>
                                M. avg.:
                            </Typography>
                            <Typography variant='body2' textAlign="right">
                                <Amount value={stats.monthAmount} currency={cat.currency}/><br/>
                                <Amount value={stats.last30Days} currency={cat.currency}/><br/>
                                <Amount value={stats.monthlyAverage} currency={cat.currency}/>
                            </Typography>
                        </Box>
                        <Sparkline stats={stats} />
                    </Paper>
                </a>
            }) }
        </Box>
    </MainScreen>
})

function Amount ({ value, currency }: { value: number, currency: string }): ReactElement {
    return <Typography noWrap
        component="span"
        variant="body2"
        color='primary.main'
    >
        {formatCurrency(value === 0 ? value : -value, currency)}
    </Typography>
}
