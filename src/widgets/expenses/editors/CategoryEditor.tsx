import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, FormControlLabel, Switch, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { match } from 'ts-pattern'

import { deepEqual } from '../../../helpers/deepEqual'
import { showIf } from '../../../helpers/smallTools'
import { CategoriesModel } from '../../../model/categories'
import { CurrenciesModel } from '../../../model/currencies'
import { type Category, type Operation } from '../../../model/model'
import { OperationsModel } from '../../../model/operations'
import { CurrencySelector } from '../../CurrencySelector'
import { DeleteCategory } from '../../DeleteCategory'
import { ActionFab } from '../../generic/ActionButton'
import { GoalInput } from './GoalInput'

interface EditorProps {
    cat: Category
    setCat: (cat: Category) => void
}

export const CategoryEditor = observer(({ cat, setCat }: EditorProps): ReactElement => {
    const virtual = cat.name === '_total' || cat.name === '_'
    const currenciesModel = CurrenciesModel.instance()
    const categoriesModel = CategoriesModel.instance()
    const operationsModel = OperationsModel.instance()

    const navigate = useNavigate()
    const [delOpen, setDelOpen] = useState(false)
    const [currencySelector, setCurrencySelector] = useState(false)
    const [newCat, setNewCat] = useState(cat)

    useEffect(() => {
        setNewCat(cat)
    }, [cat])

    const trimmedName = newCat.name.trim()
    const nameConflict = trimmedName !== cat.name
        && categoriesModel.categories?.has(newCat.name) === true
        && categoriesModel.get(newCat.name).deleted !== true

    const onSave = useMemo(
        () => {
            if (
                deepEqual(cat, newCat)
                || trimmedName === ''
                || newCat.perDayAmount === 0
                || nameConflict
            ) {
                return null
            }

            return async () => {
                await categoriesModel.put({ ...newCat, name: trimmedName, lastModified: DateTime.utc() })

                if (trimmedName !== cat.name) {
                    const changedOps: Operation[] = []
                    if (operationsModel.operations === null) {
                        throw Error('Operations not loaded')
                    }

                    for (const op of operationsModel.operations) {
                        if (
                            (op.type === 'expense' || op.type === 'income')
                            && op.categories.find(c => c.name === cat.name) !== undefined
                        ) {
                            changedOps.push({
                                ...op,
                                lastModified: DateTime.utc(),
                                categories: op.categories.map((c) => {
                                    return {
                                        ...c,
                                        name: c.name === cat.name ? trimmedName : c.name
                                    }
                                })
                            })
                        }
                    }
                    await operationsModel.put(changedOps)
                    await categoriesModel.put({ ...cat, deleted: true, lastModified: DateTime.utc() })
                    navigate(`/categories/${encodeURIComponent(trimmedName)}`)
                }

                setCat(newCat)
            }
        },
        [
            cat,
            newCat
        ]
    )

    return (
        <Box mt={1}>
            {
            showIf(
                !virtual,
                <TextField
                    error={trimmedName === '' || nameConflict}
                    helperText={match(null)
                        .when(() => trimmedName === '', () => 'Blank name')
                        .when(() => nameConflict, () => 'Already exists')
                        .otherwise(() => 'Ok')}
                    label={'Name'}
                    size={'small'}
                    fullWidth
                    variant={'filled'}
                    value={newCat.name}
                    onChange={(ev) => {
                        setNewCat({ ...newCat, name: ev.target.value })
                    }}
                />
            )
        }
            <FormControlLabel
                control={(
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
                )}
                label={'Set goal'}
            />
            {
            newCat.perDayAmount !== undefined
                ? (
                    <GoalInput
                        perDayAmount={newCat.perDayAmount}
                        onPerDayAmountChange={(perDayAmount) => {
                            setNewCat({ ...newCat, perDayAmount })
                        }}
                        currency={newCat.currency ?? ''}
                        onCurrencyChange={(currency) => {
                            setNewCat({ ...newCat, currency })
                        }}
                    />
                    )
                : null
        }
            <ActionFab
                action={onSave}
            >
                <FontAwesomeIcon icon={faCheck} />
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
                        sx={{ mt: 4 }}
                    >
                        {'Delete'}
                    </Button>
                    <DeleteCategory name={cat.name} open={delOpen} setOpen={setDelOpen} />
                </>
            )
        }
            {
            showIf(
                currencySelector,
                <CurrencySelector
                    currency={newCat.currency ?? ''}
                    onClose={() => { setCurrencySelector(false) }}
                    onCurrencySelected={(c) => {
                        setNewCat({
                            ...newCat,
                            currency: c
                        })
                    }}
                />
            )
        }
        </Box>
    )
})
