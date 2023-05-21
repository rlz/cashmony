import React, { type ReactElement } from 'react'
import { type Category, type ExpenseOperation } from '../model/model'
import { observer } from 'mobx-react-lite'
import { CategoriesModel } from '../model/categories'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Typography } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { formatExchangeRate } from '../helpers/currencies'
import { CurrencyInput } from './CurrencyInput'

interface Props {
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void

    opAmount: number
    opCurrency: string

    categories: ExpenseOperation['categories']
    onCategoriesChange: (categories: ExpenseOperation['categories']) => void
}

const categoriesModel = CategoriesModel.instance()

function getCat (categories: ExpenseOperation['categories']): Category | null {
    if (categories.length === 0) return null
    if (categories.length === 1) return categoriesModel.categories[categories[0].name]

    throw Error('TODO: more then one category is not supported')
}

export const CategoriesEditor = observer((props: Props): ReactElement => {
    const category = getCat(props.categories)

    return <Accordion
        disableGutters
        expanded={props.expanded}
        onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
    >
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
            <Typography>Category</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={1} maxHeight="128px" overflow="scroll">
                { Object.values(categoriesModel.categories).map(c => {
                    if (category !== null && c.name === category.name) {
                        return <a
                            key={c.name}
                            onClick={() => {
                                props.onCategoriesChange([])
                            }}
                        >
                            <Chip color="primary" size='small' label={c.name}/>
                        </a>
                    }
                    return <a
                        key={c.name}
                        onClick={() => {
                            props.onCategoriesChange([
                                {
                                    name: c.name,
                                    amount: category === null ? 0 : props.categories[0].amount
                                }
                            ])
                        }}
                    >
                        <Chip size='small' label={c.name}/>
                    </a>
                })}
            </Box>
            {category === null || props.opCurrency === category.currency
                ? null
                : <Box mt={1}>
                    <CurrencyInput
                        negative={props.opAmount < 0}
                        label={`Amount — ${formatExchangeRate(props.opAmount, props.categories[0].amount)}`}
                        amount={props.categories[0].amount}
                        currency={category.currency}
                        onAmountChange={(accountAmount) => {
                            props.onCategoriesChange([{
                                name: category.name,
                                amount: accountAmount
                            }])
                        }}
                    />
                </Box>
            }
        </AccordionDetails>
    </Accordion>
})
