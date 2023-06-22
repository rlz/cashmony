import React, { type ReactElement } from 'react'
import { type ExpenseOperation } from '../../../model/model'
import { observer } from 'mobx-react-lite'
import { CategoriesModel } from '../../../model/categories'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { formatExchangeRate } from '../../../helpers/currencies'
import { CurrencyInput } from '../../CurrencyInput'
import { CategoriesSelect } from '../../select/CategoriesSelect'
import { P, match } from 'ts-pattern'
import { showIfLazy } from '../../../helpers/smallTools'

interface Props {
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void

    opAmount: number
    negative: boolean
    opCurrency: string

    categories: ExpenseOperation['categories']
    onCategoriesChange: (categories: ExpenseOperation['categories']) => void
}

const categoriesModel = CategoriesModel.instance()

export const CategoriesEditor = observer((props: Props): ReactElement => {
    const category = match(props.categories)
        .with([], () => null)
        .with([P._], ([cat]) => categoriesModel.get(cat.name))
        .otherwise(() => { throw Error('TODO: more then one category is not supported') })

    return <Accordion
        disableGutters
        expanded={props.expanded}
        onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
    >
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
            <Typography>Category</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <CategoriesSelect
                selected={
                    match(props.categories)
                        .with([], () => [])
                        .with([P._], ([cat]) => [cat.name])
                        .otherwise(() => { throw Error('TODO: more then one category is not supported') })
                }
                onSelectedChange={(selected) => {
                    props.onCategoriesChange(selected.map(name => {
                        return {
                            name,
                            amount: props.categories[0]?.amount ?? 0
                        }
                    }))
                }}
                selectMany={false}
                selectZero={true}
                showHidden={false}
            />
            {
                showIfLazy(
                    category !== null && props.opCurrency !== category.currency,
                    () => <Box mt={1}>
                        <CurrencyInput
                            negative={props.negative}
                            label={`Amount — ${formatExchangeRate(props.opAmount, props.categories[0].amount)}`}
                            amount={props.categories[0].amount}
                            currency={category?.currency ?? ''}
                            onAmountChange={(accountAmount) => {
                                props.onCategoriesChange([{
                                    name: category?.name ?? '',
                                    amount: accountAmount
                                }])
                            }}
                        />
                    </Box>
                )
            }
        </AccordionDetails>
    </Accordion>
})
