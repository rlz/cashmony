import React, { type ReactElement } from 'react'
import { type AdjustmentOperation } from '../../../model/model'
import { BaseOpCard } from './BaseOpCard'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamation } from '@fortawesome/free-solid-svg-icons'

interface Props {
    operation: AdjustmentOperation
}

export function AdjustmentCard ({ operation }: Props): ReactElement {
    return <BaseOpCard
        opId={operation.id}
        color='warning'
        icon={<FontAwesomeIcon icon={faExclamation}/>}
        categoryName="Adjustment"
        categoryGrey
        amount={operation.amount}
        accountName={operation.account.name}
        currency={operation.currency}
        tags={operation.tags}
        comment={operation.comment}
    />
}
