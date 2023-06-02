import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement, useEffect } from 'react'
import { EditorScreen } from '../widgets/EditorScreen'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Button, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { CategoriesModel } from '../model/categories'
import { useNavigate, useParams } from 'react-router-dom'
import { formatCurrency } from '../helpers/currencies'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { CatMonthStats } from '../model/stats'
import { CurrencyInput } from '../widgets/CurrencyInput'
import { type Category } from '../model/model'
// import { OperationsModel } from '../model/operations'

const categoriesModel = CategoriesModel.instance()
// const operationsModel = OperationsModel.instance()

export const CategoryScreen = observer(() => {
    const catName = useParams().catName

    if (catName === undefined) {
        throw Error('catName expected here')
    }

    const [cat, setCat] = useState<Category | null>(null)
    const [newCatName, setNewCatName] = useState(catName)
    const navigate = useNavigate()

    useEffect(() => {
        const category = categoriesModel.get(catName)
        setCat(category)
    }, [categoriesModel.categories.size])

    if (cat === null) {
        return <EmptyScreen />
    }

    const stats = CatMonthStats.for(cat)

    const fCur = (amount: number): ReactElement => <Typography
        component="span"
        variant='body2'
        color="primary.main"
    >
        {formatCurrency(amount, cat.currency)}
    </Typography>

    return <EditorScreen
        navigateOnBack='/categories'
        title="Category"
        onSave={async () => {
            await categoriesModel.put(cat)
            navigate('/categories')
        }}>
        <Typography variant='h5' textAlign="center" mt={2}>
            {cat.name}
        </Typography>
        <Typography variant='body2' textAlign="center">
            Goal: {stats.monthlyGoal === null ? '-' : fCur(stats.monthlyGoal)}
        </Typography>
        <Typography component="div" variant='body2' my={2}>
            <Box display="flex">
                <Box flex="1 0 0">
                    This month:<br/>
                    Last 30 days:<br/>
                    Monthly average:
                </Box>
                <Box textAlign="right">
                    {fCur(stats.monthAmount)}<br/>
                    {fCur(stats.last30Days)}<br/>
                    {fCur(stats.monthlyAverage)}
                </Box>
            </Box>
        </Typography>
        <Accordion disableGutters >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
                <Typography>Rename</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <TextField
                    label='Name'
                    size="small"
                    fullWidth
                    variant="filled"
                    value={newCatName}
                    onChange={ev => { setNewCatName(ev.target.value) }}
                />
            </AccordionDetails>
            <AccordionActions>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                        alert('!')
                    }}
                >Rename</Button>
            </AccordionActions>
        </Accordion>
        <FormControlLabel control={<Switch checked={cat.hidden} />} label="Hidden" />
        <Accordion disableGutters >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
                <Typography>Goal</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <CurrencyInput
                    label='Amount'
                    currency={cat.currency}
                    negative={true}
                    amount={(cat.yearGoal ?? 0) / 12}
                    onAmountChange={amount => {
                        setCat({
                            ...cat,
                            yearGoal: amount * 12
                        })
                    }}
                />
            </AccordionDetails>
        </Accordion>

    </EditorScreen>
})

function EmptyScreen (): ReactElement {
    return <EditorScreen navigateOnBack='/categories' title="Categories"/>
}
