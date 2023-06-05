import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement, useEffect } from 'react'
import { EditorScreen } from '../widgets/EditorScreen'
import { Accordion, AccordionDetails, AccordionSummary, Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { CategoriesModel } from '../model/categories'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { CurrencyInput } from '../widgets/CurrencyInput'
import { type Operation, type Category } from '../model/model'
import { OperationsModel } from '../model/operations'
import { deepEqual } from '../helpers/deepEqual'
import { DateTime } from 'luxon'
import { CategoryStats } from '../model/stats'
import { formatCurrency } from '../helpers/currencies'

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

    const stats = CategoryStats.for({ ...newCat, name: cat.name })

    const cur = (amount: number, compact = false): string => formatCurrency(amount, cat.currency, compact)

    let onSave: (() => Promise<void>) | null = null
    if (
        !deepEqual(cat, newCat) &&
        newCat.name.trim() !== '' &&
        (
            newCat.name === cat.name ||
            !categoriesModel.categories.has(newCat.name) ||
            categoriesModel.get(newCat.name).deleted === true
        )
    ) {
        onSave = async () => {
            await categoriesModel.put({ ...newCat, lastModified: DateTime.utc() })

            if (newCat.name !== cat.name) {
                const changedOps: Operation[] = []
                for (const op of operationsModel.operations) {
                    if (
                        (op.type === 'expense' || op.type === 'income') &&
                        op.categories.find((c) => c.name === cat.name) !== undefined
                    ) {
                        changedOps.push({
                            ...op,
                            lastModified: DateTime.utc(),
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
                await categoriesModel.put({ ...cat, deleted: true, lastModified: DateTime.utc() })
            }

            navigate('/categories')
        }
    }

    const goal30 = stats.goal(30)

    return <EditorScreen
        navigateOnBack='/categories'
        title="Category"
        onSave={onSave}>
        <Typography variant='h5' textAlign="center" mt={2}>
            {newCat.name.trim() === '' ? '-' : newCat.name}
        </Typography>
        <Typography variant='h5' textAlign="center" color='primary.main' my={1}>
            {cur(-stats.periodTotal())}
        </Typography>
        <Typography variant='body2' textAlign="center">
            Period Pace (30d): {cur(-stats.periodAvg(30))}<br/>
            Goal (30d): {goal30 !== null ? cur(-goal30) : '-'}
        </Typography>
        <Typography variant='body1' textAlign="center" mt={1}>
            Avg. Pace (30d)
        </Typography>
        <Box display="flex" mb={1}>
            <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                                        1 month<br/>
                {cur(-stats.lastPeriodAvg(30, { month: 1 }), true)}
            </Typography>
            <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                                        3 month<br/>
                {cur(-stats.lastPeriodAvg(30, { months: 3 }), true)}
            </Typography>
            <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                                        1 year<br/>
                {cur(-stats.lastPeriodAvg(30, { year: 1 }), true)}
            </Typography>
        </Box>

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
                    error={
                        newCat.name !== cat.name &&
                        categoriesModel.categories.has(newCat.name) &&
                        categoriesModel.get(newCat.name).deleted !== true
                    }
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
