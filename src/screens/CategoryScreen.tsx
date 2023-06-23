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
import { ExpensesStats, Operations } from '../model/stats'
import { formatCurrency } from '../helpers/currencies'
import { ExpensesBarsPlot, ExpensesTotalPlot } from '../widgets/ExpensesPlots'
import { DeleteCategory } from '../widgets/DeleteCategory'
import { MainScreen } from '../widgets/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'
import { AppState } from '../model/appState'
import { nonNull, run, showIf } from '../helpers/smallTools'
import { match } from 'ts-pattern'
import { runInAction } from 'mobx'
import { CurrenciesModel } from '../model/currencies'
import { utcToday } from '../helpers/dates'

const appState = AppState.instance()
const currenciesModel = CurrenciesModel.instance()
const categoriesModel = CategoriesModel.instance()
const operationsModel = OperationsModel.instance()

export const CategoryScreen = observer(() => {
    const catName = nonNull(useParams().catName, 'catName expected here')
    const currency = appState.masterCurrency

    const [cat, setCat] = useState<Category | null>(null)
    const [newCat, setNewCat] = useState<Category | null>(null)
    const [tab, setTab] = useState(0)
    const navigate = useNavigate()

    useEffect(
        () => {
            if (catName === '_' || catName === '_total') {
                const category: Category = {
                    name: match(catName)
                        .with('_', () => 'Uncategorized')
                        .with('_total', () => 'Total')
                        .exhaustive(),
                    hidden: false,
                    lastModified: DateTime.utc(),
                    yearGoalUsd: match(catName)
                        .with('_', () => appState.uncategorizedGoalUsd ?? undefined)
                        .with('_total', () => appState.totalGoalUsd ?? undefined)
                        .exhaustive()
                }
                setCat(category)
                setNewCat(category)
                return
            }
            const category = categoriesModel.get(catName)
            setCat(category)
            setNewCat(category)
        },
        [
            categoriesModel.categories,
            appState.masterCurrency,
            appState.totalGoalUsd,
            appState.uncategorizedGoalUsd
        ]
    )

    if (cat === null || newCat === null) {
        return <EmptyScreen />
    }

    const stats = match(catName)
        .with('_total', () => new ExpensesStats(Operations.forFilter(appState.filter), appState.totalGoalUsd))
        .with('_', () => new ExpensesStats(Operations.forFilter(appState.filter).onlyUncategorized(), appState.uncategorizedGoalUsd))
        .otherwise(() => new ExpensesStats(
            Operations.forFilter(appState.filter).keepTypes('expense', 'income').keepCategories(cat.name), newCat.yearGoalUsd ?? null)
        )

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    const onSave = run(() => {
        if (
            deepEqual(cat, newCat) ||
            newCat.name.trim() === '' ||
            (
                newCat.name !== cat.name &&
                categoriesModel.categories.has(newCat.name) &&
                categoriesModel.get(newCat.name).deleted !== true
            )
        ) {
            return null
        }

        return async () => {
            if (catName === '_') {
                runInAction(() => {
                    appState.uncategorizedGoalUsd = newCat.yearGoalUsd ?? null
                })
            } else if (catName === '_total') {
                runInAction(() => {
                    appState.totalGoalUsd = newCat.yearGoalUsd ?? null
                })
            } else {
                await categoriesModel.put({ ...newCat, lastModified: DateTime.utc() })
            }

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
    })

    const goalUsd30 = stats.goalUsd(30)

    return <MainScreen
        navigateOnBack='/categories'
        title="Category"
        onSave={onSave}
    >
        <Typography variant='h6' textAlign="center" mt={2}>
            {newCat.name.trim() === '' ? '-' : newCat.name}
        </Typography>
        <Typography variant='h6' textAlign="center" color='primary.main' mb={1}>
            {cur(-stats.amountTotal(appState.timeSpan, currency))}
        </Typography>
        <Typography variant='body2' textAlign="center">
            Goal (30d): {goalUsd30 !== null ? cur(-goalUsd30 * currenciesModel.getFromUsdRate(utcToday(), currency)) : '-'}
        </Typography>
        <Tabs value={tab} onChange={(_, tab) => { setTab(tab) }} variant='fullWidth'>
            <Tab label="Stats"/>
            <Tab label="Modify"/>
            <Tab label="Operations"/>
        </Tabs>
        <Box overflow="scroll">
            {
                match(tab)
                    .with(0, () => <Stats currency={currency} stats={stats} />)
                    .with(1, () => <Editor
                        full={catName !== '_total' && catName !== '_'}
                        cat={cat}
                        newCat={newCat}
                        setNewCat={setNewCat}
                    />)
                    .with(2, () => <OpsList
                        operations={stats.operations.forTimeSpan(appState.timeSpan)}
                    />)
                    .otherwise(() => { throw Error('Unimplenented tab') })
            }
            <Box minHeight={72}/>
        </Box>
    </MainScreen>
})

function EmptyScreen (): ReactElement {
    return <MainScreen navigateOnBack='/categories' title="Category"/>
}

function Stats ({ currency, stats }: { currency: string, stats: ExpensesStats }): ReactElement {
    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    const timeSpan = appState.timeSpan

    const leftPerDay = appState.daysLeft > 0 && stats.yearGoalUsd !== null
        ? -(stats.leftPerDay(timeSpan, currency) ?? -0)
        : -1

    return <Box display="flex" flexDirection="column" gap={1} pb={1}>
        <Typography component="div" variant='body2' mt={1} py={1}>
            <table className='stats'>
                <tbody>
                    <tr>
                        <th>Period Pace (30d):</th>
                        <td>{cur(-stats.avgUntilToday(30, timeSpan, currency))}</td>
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
                    {cur(-stats.durationAvg(30, { month: 1 }, currency), true)}
                </Typography>
                <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                3 month<br/>
                    {cur(-stats.durationAvg(30, { months: 3 }, currency), true)}
                </Typography>
                <Typography variant='body2' textAlign="center" flex="1 1 0" noWrap minWidth={0}>
                1 year<br/>
                    {cur(-stats.durationAvg(30, { year: 1 }, currency), true)}
                </Typography>
            </Box>
        </Paper>
        <ExpensesBarsPlot currency={currency} stats={stats}/>
        <ExpensesTotalPlot currency={currency} stats={stats}/>
    </Box>
}

interface EditorProps {
    full: boolean
    cat: Category
    newCat: Category
    setNewCat: (cat: Category) => void
}

const Editor = observer(({ full, cat, newCat, setNewCat }: EditorProps): ReactElement => {
    const currency = appState.masterCurrency
    const fromUsdRate = currenciesModel.getFromUsdRate(utcToday(), currency)

    const [open, setOpen] = useState<'name' | 'goal' | null>(null)
    const [delOpen, setDelOpen] = useState(false)
    const [goal, setGoal] = useState((newCat.yearGoalUsd ?? 0) * fromUsdRate / 12)

    return <Box mt={1}>
        {
            showIf(
                full,
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
            )
        }
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
                            checked={newCat.yearGoalUsd !== undefined}
                            onChange={(_, checked) => {
                                setNewCat({
                                    ...newCat,
                                    yearGoalUsd: checked ? 0 : undefined
                                })
                            }}
                        />
                    }
                    label="Set goal"
                />
                {
                    newCat.yearGoalUsd !== undefined
                        ? <CurrencyInput
                            label='Amount'
                            currency={currency}
                            negative={true}
                            amount={goal}
                            onAmountChange={amount => {
                                setGoal(amount)
                                setNewCat({
                                    ...newCat,
                                    yearGoalUsd: amount * 12 / fromUsdRate
                                })
                            }}
                        />
                        : null
                }
            </AccordionDetails>
        </Accordion>
        {
            showIf(
                full,
                <>
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
                </>
            )
        }
    </Box>
})
