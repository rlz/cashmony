import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { deepEqual } from '../../../helpers/deepEqual'
import { showIf } from '../../../helpers/smallTools'
import { AppState } from '../../../model/appState'
import { CategoriesModel } from '../../../model/categories'
import { CurrenciesModel } from '../../../model/currencies'
import { type Category, type Operation } from '../../../model/model'
import { OperationsModel } from '../../../model/operations'
import { CurrencySelector } from '../../CurrencySelector'
import { DeleteCategory } from '../../DeleteCategory'
import { ActionFab } from '../../generic/ActionButton'
import { GoalInput } from './GoalInput'

interface EditorProps {
    origCat: Category
    newCat: Category
    setCat: (cat: Category) => void
    setNewCat: (cat: Category) => void
}

export const CategoryEditor = observer(({ origCat, newCat, setCat, setNewCat }: EditorProps): ReactElement => {
    const appState = AppState.instance()
    const virtual = origCat?.name === '_total' || origCat?.name === '_'
    const currenciesModel = CurrenciesModel.instance()
    const categoriesModel = CategoriesModel.instance()
    const operationsModel = OperationsModel.instance()

    const navigate = useNavigate()
    const [open, setOpen] = useState<'name' | 'goal' | null>(null)
    const [delOpen, setDelOpen] = useState(false)
    const [currencySelector, setCurrencySelector] = useState(false)

    const onSave = useMemo(
        () => {
            if (
                origCat === null ||
                newCat === null ||
                currenciesModel.rates === null ||
                deepEqual(origCat, newCat) ||
                newCat.name.trim() === '' ||
                newCat.perDayAmount === 0 ||
                (
                    newCat.name !== origCat.name &&
                    categoriesModel.categories.has(newCat.name) &&
                    categoriesModel.get(newCat.name).deleted !== true
                )
            ) {
                return null
            }

            return async () => {
                if (origCat.name === '_') {
                    runInAction(() => {
                        appState.uncategorizedGoalAmount = newCat.perDayAmount === undefined ? null : newCat.perDayAmount
                        appState.uncategorizedGoalCurrency = newCat.currency ?? 'USD'
                    })
                } else if (origCat.name === '_total') {
                    runInAction(() => {
                        appState.totalGoalAmount = newCat.perDayAmount === undefined ? null : newCat.perDayAmount
                        appState.totalGoalCurrency = newCat.currency ?? 'USD'
                    })
                } else {
                    await categoriesModel.put({ ...newCat, lastModified: DateTime.utc() })
                }

                if (newCat.name !== origCat.name) {
                    const changedOps: Operation[] = []
                    for (const op of operationsModel.operations) {
                        if (
                            (op.type === 'expense' || op.type === 'income') &&
                            op.categories.find((c) => c.name === origCat.name) !== undefined
                        ) {
                            changedOps.push({
                                ...op,
                                lastModified: DateTime.utc(),
                                categories: op.categories.map(c => {
                                    return {
                                        ...c,
                                        name: c.name === origCat.name ? newCat.name : origCat.name
                                    }
                                })
                            })
                        }
                    }
                    await operationsModel.put(changedOps)
                    await categoriesModel.put({ ...origCat, deleted: true, lastModified: DateTime.utc() })
                    navigate(`/categories/${encodeURIComponent(newCat.name)}`)
                }

                setCat(newCat)
            }
        },
        [
            origCat,
            newCat
        ]
    )

    return <Box mt={1}>
        {
            showIf(
                !virtual,
                <Accordion
                    disableGutters
                    expanded={open === 'name'}
                    onChange={(_, expanded) => {
                        setOpen(expanded ? 'name' : null)
                    }}
                >
                    <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
                        <Typography>{'Name'}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TextField
                            error={
                                newCat.name !== origCat?.name &&
                                categoriesModel.categories.has(newCat.name) &&
                                categoriesModel.get(newCat.name).deleted !== true
                            }
                            label={'Name'}
                            size={'small'}
                            fullWidth
                            variant={'filled'}
                            value={newCat.name}
                            onChange={ev => {
                                setNewCat({ ...newCat, name: ev.target.value })
                            }}
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
                <Typography>{'Goal'}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <FormControlLabel
                    control={
                        <Switch
                            checked={newCat.perDayAmount !== undefined}
                            onChange={(_, checked) => {
                                setNewCat({
                                    ...newCat,
                                    perDayAmount: checked ? 0 : undefined,
                                    currency: checked ? currenciesModel.currencies[0] : undefined
                                })
                            }}
                        />
                    }
                    label={'Set goal'}
                />
                {
                    newCat.perDayAmount !== undefined
                        ? <GoalInput
                            perDayAmount={newCat.perDayAmount}
                            onPerDayAmountChange={perDayAmount => {
                                setNewCat({ ...newCat, perDayAmount })
                            }}
                            currency={newCat.currency ?? ''}
                            onCurrencyChange={currency => {
                                setNewCat({ ...newCat, currency })
                            }}
                        />
                        : null
                }
            </AccordionDetails>
        </Accordion>
        <ActionFab
            action={onSave}
        >
            <FontAwesomeIcon icon={faCheck}/>
        </ActionFab>
        {
            showIf(
                !virtual,
                <>
                    <Button
                        variant={'contained'}
                        color={'error'}
                        onClick={() => { setDelOpen(true) }}
                        fullWidth
                        sx={{ mt: 1 }}
                    >
                        {'Delete'}
                    </Button>
                    <DeleteCategory name={origCat.name} open={delOpen} setOpen={setDelOpen} />
                </>
            )
        }
        {
            showIf(
                currencySelector,
                <CurrencySelector
                    currency={newCat.currency ?? ''}
                    onClose={() => { setCurrencySelector(false) }}
                    onCurrencySelected={c => {
                        setNewCat({
                            ...newCat,
                            currency: c
                        })
                    }}
                />
            )
        }
    </Box>
})
