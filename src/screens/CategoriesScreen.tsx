import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { MainScreen } from '../widgets/MainScreen'
import { Box, Paper, Typography } from '@mui/material'
import { AppState } from '../model/appState'
import { formatCurrency } from '../helpers/currencies'
import { CategoriesModel } from '../model/categories'

const appState = AppState.instance()
const categoriesModel = CategoriesModel.instance()

export const CategoriesScreen = observer((): ReactElement => {
    const date = appState.startDate
    const currentAmounts = categoriesModel.getAmounts(date)
    const dayBeforeMonth = date.set({ day: 1 }).minus({ day: 1 })
    const dayBeforeMonthAmounts = categoriesModel.getAmounts(dayBeforeMonth)
    const daysBefore30 = date.minus({ days: 30 })
    const daysBeforeAmounts30 = categoriesModel.getAmounts(daysBefore30)
    const daysBefore365 = date.minus({ days: 365 })
    const daysBeforeAmounts365 = categoriesModel.getAmounts(daysBefore365)

    return <MainScreen>
        <Box
            display="flex"
            flexDirection="column"
            gap={1}
            p={1}
        >
            { categoriesModel.categoriesSorted.map(c => categoriesModel.get(c)).map(cat => {
                const thisMonthAmount = (currentAmounts.get(cat.name) ?? 0) - (dayBeforeMonthAmounts.get(cat.name) ?? 0)
                const daysAmount30 = (currentAmounts.get(cat.name) ?? 0) - (daysBeforeAmounts30.get(cat.name) ?? 0)
                const daysAmount365 = (currentAmounts.get(cat.name) ?? 0) - (daysBeforeAmounts365.get(cat.name) ?? 0)

                return <Paper
                    key={cat.name}
                    sx={{ p: 1, display: 'flex' }}
                >
                    <Typography variant='body1'>
                        {cat.name}
                    </Typography>
                    <Box flex="1 0 0" textAlign="right">
                        <Typography>
                            This month: <Amount value={thisMonthAmount} currency={cat.currency}/><br/>
                            Last 30 days: <Amount value={daysAmount30} currency={cat.currency}/><br/>
                            Last 365 days: <Amount value={daysAmount365} currency={cat.currency}/>
                        </Typography>
                    </Box>
                </Paper>
            }) }
        </Box>
    </MainScreen>
})

function Amount ({ value, currency }: { value: number, currency: string }): ReactElement {
    return <Typography noWrap
        component="span"
        variant="body2"
        color={value < 0 ? 'error' : (value > 0 ? 'success' : 'info.main')}
    >
        {formatCurrency(Math.abs(value), currency)}
    </Typography>
}
