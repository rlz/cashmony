import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, FormControlLabel, Switch, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { match } from 'ts-pattern'

import { Category } from '../../../engine/model.js'
import { sortCurrencies } from '../../../engine/sortCurrencies.js'
import { deepEqual } from '../../helpers/deepEqual.js'
import { showIf } from '../../helpers/smallTools.js'
import { useEngine } from '../../useEngine.js'
import { CurrencySelector } from '../../widgets/CurrencySelector.js'
import { DeleteCategory } from '../../widgets/DeleteCategory.js'
import { GoalInput } from '../../widgets/expenses/editors/GoalInput.js'
import { ActionFab } from '../../widgets/generic/ActionButton.js'

interface EditorProps {
    cat: Category
    setCat: (cat: Category) => void
}

export const CategoryEditor = observer(({ cat, setCat }: EditorProps): ReactElement => {
    const engine = useEngine()

    const [delOpen, setDelOpen] = useState(false)
    const [currencySelector, setCurrencySelector] = useState(false)
    const [newCat, setNewCat] = useState(cat)

    useEffect(() => {
        setNewCat(cat)
    }, [cat])

    const trimmedName = newCat.name.trim()
    const nameConflict = trimmedName !== cat.name
        && engine.hasCategoryWithName(newCat.name)

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

            return () => {
                engine.pushCategory({ ...newCat, name: trimmedName, lastModified: DateTime.utc() })

                setCat(newCat)
            }
        },
        [
            cat,
            newCat
        ]
    )

    const defaulCurrency = useMemo(
        () => sortCurrencies(engine)[0],
        [engine.operations]
    )

    return (
        <Box mt={1}>
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
            <FormControlLabel
                control={(
                    <Switch
                        checked={newCat.perDayAmount !== undefined}
                        onChange={(_, checked) => {
                            setNewCat({
                                ...newCat,
                                perDayAmount: checked ? 0 : undefined,
                                currency: checked ? defaulCurrency : undefined
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
            <Button
                variant={'contained'}
                color={'error'}
                onClick={() => { setDelOpen(true) }}
                fullWidth
                sx={{ mt: 4 }}
            >
                {'Delete'}
            </Button>
            <DeleteCategory id={cat.id} open={delOpen} setOpen={setDelOpen} />
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
