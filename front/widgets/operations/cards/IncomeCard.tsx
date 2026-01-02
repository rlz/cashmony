import { faHandHoldingDollar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { type ReactElement } from 'react'

import { type IncomeOperation } from '../../../../engine/model.js'
import { useEngine } from '../../../useEngine.js'
import { BaseOpCard } from './BaseOpCard.js'

interface Props {
    operation: IncomeOperation
}

export function IncomeCard({ operation }: Props): ReactElement {
    const engine = useEngine()

    let categoryName = 'No categories'
    let categoryGrey = true

    if (operation.categories.length === 1) {
        categoryName = engine.getCategory(operation.categories[0].id).name
        categoryGrey = false
    } else if (operation.categories.length > 1) {
        categoryName = `${operation.categories.length} categories`
        categoryGrey = false
    }

    return (
        <BaseOpCard
            opId={operation.id}
            color={'success'}
            icon={<FontAwesomeIcon icon={faHandHoldingDollar} />}
            categoryName={categoryName}
            categoryGrey={categoryGrey}
            amount={operation.amount}
            accountName={engine.getAccount(operation.account.id).name}
            currency={operation.currency}
            tags={operation.tags}
            comment={operation.comment}
        />
    )
}
