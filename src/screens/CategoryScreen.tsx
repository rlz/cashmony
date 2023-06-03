import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement, useEffect } from 'react'
import { EditorScreen } from '../widgets/EditorScreen'
import { Accordion, AccordionDetails, AccordionSummary, Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { CategoriesModel } from '../model/categories'
import { useNavigate, useParams } from 'react-router-dom'
import { formatCurrency } from '../helpers/currencies'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { CatMonthStats } from '../model/stats'
import { CurrencyInput } from '../widgets/CurrencyInput'
import { type Operation, type Category } from '../model/model'
import deepEqual from 'fast-deep-equal'
import { OperationsModel } from '../model/operations'

const categoriesModel = CategoriesModel.instance()
const operationsModel = OperationsModel.instance()

export const CategoryScreen = observer(() => {
    const catName = useParams().catName

    if (catName === undefined) {
        throw Error('catName expected here')
    }

    const [cat, setCat] = useState<Category | null>(null)
    const [newCat, setNewCat] = useState<Category | null>(null)
    const [open, setOpen] = useState<'name' | 'goal' | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const category = categoriesModel.get(catName)
        setCat(category)
        setNewCat(category)
    }, [categoriesModel.categories.size])

    if (cat === null || newCat === null) {
        return <EmptyScreen />
    }

    const stats = CatMonthStats.for({ ...newCat, name: cat.name })

    const fCur = (amount: number): ReactElement => <Typography
        component="span"
        variant='body2'
        color="primary.main"
    >
        {formatCurrency(amount, cat.currency)}
    </Typography>

    let onSave: (() => Promise<void>) | null = null
    if (!deepEqual(cat, newCat)) {
        onSave = async () => {
            await categoriesModel.put(newCat)

            if (newCat.name !== cat.name) {
                const changedOps: Operation[] = []
                for (const op of operationsModel.operations) {
                    if (
                        (op.type === 'expense' || op.type === 'income') &&
                        op.categories.find((c) => c.name === cat.name) !== undefined
                    ) {
                        changedOps.push({
                            ...op,
                            categories: op.categories.map(c => {
                                return {
                                    ...c,
                                    name: c.name === cat.name ? newCat.name : cat.name
                                }
                            })
                        })
                    }
                }
                await operationsModel.put(changedOps)
                await categoriesModel.put({ ...cat, deleted: true })
            }

            navigate('/categories')
        }
    }

    return <EditorScreen
        navigateOnBack='/categories'
        title="Category"
        onSave={onSave}>
        <Typography variant='h5' textAlign="center" mt={2}>
            {newCat.name}
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
        <Accordion
            disableGutters
            expanded={open === 'name'}
            onChange={(_, expanded) => {
                setOpen(expanded ? 'name' : null)
            }}
        >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
                <Typography>Name</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <TextField
                    label='Name'
                    size="small"
                    fullWidth
                    variant="filled"
                    value={newCat.name}
                    onChange={ev => { setNewCat({ ...newCat, name: ev.target.value }) }}
                />
            </AccordionDetails>
        </Accordion>
        <Accordion
            disableGutters
            expanded={open === 'goal'}
            onChange={(_, expanded) => {
                setOpen(expanded ? 'goal' : null)
            }}
        >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
                <Typography>Goal</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <FormControlLabel
                    control={
                        <Switch
                            checked={newCat.yearGoal !== undefined}
                            onChange={(_, checked) => {
                                setNewCat({
                                    ...newCat,
                                    yearGoal: checked ? 0 : undefined
                                })
                            }}
                        />
                    }
                    label="Set goal"
                />
                {
                    newCat.yearGoal !== undefined
                        ? <CurrencyInput
                            label='Amount'
                            currency={newCat.currency}
                            negative={true}
                            amount={(newCat.yearGoal ?? 0) / 12}
                            onAmountChange={amount => {
                                setNewCat({
                                    ...newCat,
                                    yearGoal: amount * 12
                                })
                            }}
                        />
                        : null
                }
            </AccordionDetails>
        </Accordion>
        <FormControlLabel
            control={<Switch
                checked={newCat.hidden}
                onChange={(_, checked) => {
                    setNewCat({
                        ...newCat,
                        hidden: checked
                    })
                }}
            />}
            label="Hidden"
        />
    </EditorScreen>
})

function EmptyScreen (): ReactElement {
    return <EditorScreen navigateOnBack='/categories' title="Categories"/>
}