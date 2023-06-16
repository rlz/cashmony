import { observer } from 'mobx-react-lite'
import React, { useState, type ReactElement, useEffect } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, FormControlLabel, Paper, Switch, Tab, Tabs, TextField, Typography } from '@mui/material'
import { CategoriesModel } from '../model/categories'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { CurrencyInput } from '../widgets/CurrencyInput'
import { type Operation, type Category } from '../model/model'
import { OperationsModel } from '../model/operations'
import { deepEqual } from '../helpers/deepEqual'
import { DateTime } from 'luxon'
import { CategoryStats, Operations } from '../model/stats'
import { formatCurrency } from '../helpers/currencies'
import { AmountBarsCatPlot, TotalCatPlot } from '../widgets/CategoryPlots'
import { DeleteCategory } from '../widgets/DeleteCategory'
import { MainScreen } from '../widgets/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'
import { AppState } from '../model/appState'

const appState = AppState.instance()
const categoriesModel = CategoriesModel.instance()
const operationsModel = OperationsModel.instance()

export const CategoryScreen = observer(() => {
    const catName = useParams().catName

    if (catName === undefined) {
        throw Error('catName expected here')
    }

    const [cat, setCat] = useState<Category | null>(null)
    const [newCat, setNewCat] = useState<Category | null>(null)
    const [tab, setTab] = useState(0)
    const navigate = useNavigate()

    useEffect(() => {
        const category = categoriesModel.get(catName)
        setCat(category)
        setNewCat(category)
    }, [categoriesModel.categories])

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
                navigate(`/categories/${encodeURIComponent(newCat.name)}`)
            }
        }
    }

    const goal30 = stats.goal(30)

    const renderTab = (tab: number): ReactElement => {
        if (tab === 0) {
            return <Stats stats={stats} />
        }

        if (tab === 1) {
            return <Editor cat={cat} newCat={newCat} setNewCat={setNewCat}/>
        }

        if (tab === 2) {
            return <OpsList
                operations={Operations.all().forTimeSpan(appState.timeSpan).forCategories(cat.name)}
            />
        }

        throw Error('Unimplemented tab')
    }

    return <MainScreen
        navigateOnBack='/categories'
        title="Category"
        onSave={onSave}>
        <Typography variant='h6' textAlign="center" mt={2}>
            {newCat.name.trim() === '' ? '-' : newCat.name}
        </Typography>
        <Typography variant='h6' textAlign="center" color='primary.main' mb={1}>
            {cur(-stats.amountTotal())}
        </Typography>
        <Typography variant='body2' textAlign="center">
            Goal (30d): {goal30 !== null ? cur(-goal30) : '-'}
        </Typography>
        <Tabs value={tab} onChange={(_, tab) => { setTab(tab) }} variant='fullWidth'>
            <Tab label="Stats"/>
            <Tab label="Modify"/>
            <Tab label="Operations"/>
        </Tabs>
        <Box overflow="scroll">
            { renderTab(tab) }
            <Box minHeight={72}/>
        </Box>
    </MainScreen>
})

function EmptyScreen (): ReactElement {
    return <MainScreen navigateOnBack='/categories' title="Category"/>
}

function Stats ({ stats }: { stats: CategoryStats }): ReactElement {
    const cur = (amount: number, compact = false): string => formatCurrency(amount, stats.category.currency, compact)

    const leftPerDay = stats.daysLeft() > 0 && stats.category.yearGoal !== null
        ? -(stats.leftPerDay() ?? -0)
        : -1

    return <Box display="flex" flexDirection="column" gap={1} pb={1}>
        <Typography component="div" variant='body2' mt={1} py={1}>
            <table className='stats'>
                <tbody>
                    <tr>
                        <th>Period Pace (30d):</th>
                        <td>{cur(-stats.avgUntilToday(30))}</td>
                    </tr>
                    <tr>
                        <th>Left per day:</th>
                        <td>{leftPerDay > 0 ? cur(leftPerDay) : '-'}</td>
                    </tr>
                </tbody>
            </table>
        </Typography>
        <Paper elevation={2} sx={{ p: 1 }}>
            <Typography variant='h6' textAlign="center">
                Avg. Pace (30d)
            </Typography>
            <Box display="flex" mb={1}>
                <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                1 month<br/>
                    {cur(-stats.durationAvg(30, { month: 1 }), true)}
                </Typography>
                <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                3 month<br/>
                    {cur(-stats.durationAvg(30, { months: 3 }), true)}
                </Typography>
                <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                1 year<br/>
                    {cur(-stats.durationAvg(30, { year: 1 }), true)}
                </Typography>
            </Box>
        </Paper>
        <AmountBarsCatPlot stats={stats}/>
        <TotalCatPlot stats={stats}/>
    </Box>
}

interface EditorProps {
    cat: Category
    newCat: Category
    setNewCat: (cat: Category) => void
}

function Editor ({ cat, newCat, setNewCat }: EditorProps): ReactElement {
    const [open, setOpen] = useState<'name' | 'goal' | null>(null)
    const [delOpen, setDelOpen] = useState(false)

    return <Box mt={1}>
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
                                    yearGoal: checked === true ? 0 : undefined
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
        <Box my={1}>
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
        </Box>
        <Button
            variant='contained'
            color='error'
            onClick={() => { setDelOpen(true) }}
            fullWidth
        >Delete</Button>
        <DeleteCategory name={cat.name} open={delOpen} setOpen={setDelOpen} />
    </Box>
}
