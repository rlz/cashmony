import React, { type ReactElement, useState } from 'react'
import { type Category } from '../../../model/model'
import { observer } from 'mobx-react-lite'
import { AppState } from '../../../model/appState'
import { CurrenciesModel } from '../../../model/currencies'
import { CategoriesModel } from '../../../model/categories'
import { utcToday } from '../../../helpers/dates'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { showIf } from '../../../helpers/smallTools'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { CurrencyInput } from '../../CurrencyInput'
import { DeleteCategory } from '../../DeleteCategory'

interface EditorProps {
    origCatName: string
    cat: Category
    onChange: (cat: Category) => void
}

export const CategoryEditor = observer(({ origCatName, cat: newCat, onChange: setNewCat }: EditorProps): ReactElement => {
    const virtual = origCatName === '_total' || origCatName === '_'
    const appState = AppState.instance()
    const currenciesModel = CurrenciesModel.instance()
    const categoriesModel = CategoriesModel.instance()

    const currency = appState.masterCurrency
    const fromUsdRate = currenciesModel.getFromUsdRate(utcToday(), currency)

    const [open, setOpen] = useState<'name' | 'goal' | null>(null)
    const [delOpen, setDelOpen] = useState(false)
    const [goal, setGoal] = useState((newCat.yearGoalUsd ?? 0) * fromUsdRate / 12)

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
                !virtual,
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
                    <DeleteCategory name={origCatName} open={delOpen} setOpen={setDelOpen} />
                </>
            )
        }
    </Box>
})
