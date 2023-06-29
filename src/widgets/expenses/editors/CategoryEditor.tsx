import React, { type ReactElement, useState } from 'react'
import { type Category } from '../../../model/model'
import { observer } from 'mobx-react-lite'
import { CurrenciesModel } from '../../../model/currencies'
import { CategoriesModel } from '../../../model/categories'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, FormControlLabel, IconButton, Switch, TextField, Typography } from '@mui/material'
import { showIf } from '../../../helpers/smallTools'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { CurrencyInput } from '../../CurrencyInput'
import { DeleteCategory } from '../../DeleteCategory'
import { Row } from '../../Containers'
import { getCurrencySymbol } from '../../../helpers/currencies'
import { CurrencySelector } from '../../CurrencySelector'

interface EditorProps {
    origCatName: string
    cat: Category
    onChange: (cat: Category) => void
}

export const CategoryEditor = observer(({ origCatName, cat: newCat, onChange: setNewCat }: EditorProps): ReactElement => {
    const virtual = origCatName === '_total' || origCatName === '_'
    const currenciesModel = CurrenciesModel.instance()
    const categoriesModel = CategoriesModel.instance()

    const [open, setOpen] = useState<'name' | 'goal' | null>(null)
    const [delOpen, setDelOpen] = useState(false)
    const [goal, setGoal] = useState(newCat.perDayAmount ?? 0)
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
                                newCat.name !== origCatName &&
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
                    label="Set daily goal"
                />
                {
                    newCat.perDayAmount !== undefined
                        ? <Row gap={1}>
                            <IconButton
                                color='primary'
                                sx={{ width: 48 }}
                                onClick={() => { setCurrencySelector(true) }}
                            >
                                {getCurrencySymbol(newCat.currency ?? '')}
                            </IconButton>
                            <CurrencyInput
                                label='Amount'
                                currency={newCat.currency ?? ''}
                                negative={false}
                                amount={goal}
                                onAmountChange={amount => {
                                    setGoal(amount)
                                    setNewCat({
                                        ...newCat,
                                        perDayAmount: amount
                                    })
                                }}
                            />
                        </Row>
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
