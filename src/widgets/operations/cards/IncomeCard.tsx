import { faHandHoldingDollar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { type ReactElement } from 'react'

import { type IncomeOperation } from '../../../model/model'
import { BaseOpCard } from './BaseOpCard'

interface Props {
    operation: IncomeOperation
}

export function IncomeCard ({ operation }: Props): ReactElement {
    let categoryName = 'No categories'
    let categoryGrey = true

    if (operation.categories.length === 1) {
        categoryName = operation.categories[0].name
        categoryGrey = false
    } else if (operation.categories.length > 1) {
        categoryName = `${operation.categories.length} categories`
        categoryGrey = false
    }

    return <BaseOpCard
        opId={operation.id}
        color={'success'}
        icon={<FontAwesomeIcon icon={faHandHoldingDollar}/>}
        categoryName={categoryName}
        categoryGrey={categoryGrey}
        amount={operation.amount}
        accountName={operation.account.name}
        currency={operation.currency}
        tags={operation.tags}
        comment={operation.comment}
    />
}
