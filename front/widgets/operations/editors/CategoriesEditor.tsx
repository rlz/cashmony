import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { match, P } from 'ts-pattern'

import { type ExpenseOperation } from '../../../../engine/model.js'
import { CategoriesSelect } from '../../select/CategoriesSelect.js'

interface Props {
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void

    opAmount: number
    negative: boolean
    opCurrency: string

    categories: ExpenseOperation['categories']
    onCategoriesChange: (categories: ExpenseOperation['categories']) => void
}

export const CategoriesEditor = observer((props: Props): ReactElement => {
    return (
        <Accordion
            disableGutters
            expanded={props.expanded}
            onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
        >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                <Typography>{'Category'}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <CategoriesSelect
                    selected={
                        match(props.categories)
                            .with([], () => [])
                            .with([P._], ([cat]) => [cat.id])
                            .otherwise(() => { throw Error('TODO: more then one category is not supported') })
                    }
                    onSelectedChange={(selected) => {
                        props.onCategoriesChange(selected.map((id) => {
                            return {
                                id,
                                amount: props.categories[0]?.amount ?? 0
                            }
                        }))
                    }}
                    selectMany={false}
                    selectZero={true}
                />
            </AccordionDetails>
        </Accordion>
    )
})
