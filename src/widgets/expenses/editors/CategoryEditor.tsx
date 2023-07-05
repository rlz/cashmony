import React, { type ReactElement, useState } from 'react'
import { type Category } from '../../../model/model'
import { observer } from 'mobx-react-lite'
import { CurrenciesModel } from '../../../model/currencies'
import { CategoriesModel } from '../../../model/categories'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { showIf } from '../../../helpers/smallTools'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { DeleteCategory } from '../../DeleteCategory'
import { CurrencySelector } from '../../CurrencySelector'
import { GoalInput } from './GoalInput'

interface EditorProps {
    origCatName: string
    cat: Category
    onChange: (cat: Category) => void
}

export const CategoryEditor = observer(({ origCatName, cat, onChange }: EditorProps): ReactElement => {
    const virtual = origCatName === '_total' || origCatName === '_'
    const currenciesModel = CurrenciesModel.instance()
    const categoriesModel = CategoriesModel.instance()

    const [open, setOpen] = useState<'name' | 'goal' | null>(null)
    const [delOpen, setDelOpen] = useState(false)
    const [currencySelector, setCurrencySelector] = useState(false)

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
                        <Typography>Name</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TextField
                            error={
                                cat.name !== origCatName &&
                                categoriesModel.categories.has(cat.name) &&
                                categoriesModel.get(cat.name).deleted !== true
                            }
                            label='Name'
                            size='small'
                            fullWidth
                            variant='filled'
                            value={cat.name}
                            onChange={ev => {
                                onChange({ ...cat, name: ev.target.value })
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
                <Typography>Goal</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <FormControlLabel
                    control={
                        <Switch
                            checked={cat.perDayAmount !== undefined}
                            onChange={(_, checked) => {
                                onChange({
                                    ...cat,
                                    perDayAmount: checked ? 0 : undefined,
                                    currency: checked ? currenciesModel.currencies[0] : undefined
                                })
                            }}
                        />
                    }
                    label='Set goal'
                />
                {
                    cat.perDayAmount !== undefined
                        ? <GoalInput
                            perDayAmount={cat.perDayAmount}
                            onPerDayAmountChange={perDayAmount => {
                                onChange({ ...cat, perDayAmount })
                            }}
                            currency={cat.currency ?? ''}
                            onCurrencyChange={currency => {
                                onChange({ ...cat, currency })
                            }}
                        />
                        : null
                }
            </AccordionDetails>
        </Accordion>
        {
            showIf(
                !virtual,
                <>
                    <Button
                        variant='contained'
                        color='error'
                        onClick={() => { setDelOpen(true) }}
                        fullWidth
                        sx={{ mt: 1 }}
                    >Delete</Button>
                    <DeleteCategory name={origCatName} open={delOpen} setOpen={setDelOpen} />
                </>
            )
        }
        {
            showIf(
                currencySelector,
                <CurrencySelector
                    currency={cat.currency ?? ''}
                    onClose={() => { setCurrencySelector(false) }}
                    onCurrencySelected={c => {
                        onChange({
                            ...cat,
                            currency: c
                        })
                    }}
                />
            )
        }
    </Box>
})
