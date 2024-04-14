import { faArrowRightLong, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { type ReactElement } from 'react'

import { type TransferOperation } from '../../../model/model'
import { Row } from '../../generic/Containers'
import { DivBody2 } from '../../generic/Typography'
import { BaseOpCard } from './BaseOpCard'

interface Props {
    operation: TransferOperation
}

export function TransferCard({ operation }: Props): ReactElement {
    return <BaseOpCard
        opId={operation.id}
        color={'info'}
        icon={<FontAwesomeIcon icon={faMoneyBillTransfer} />}
        categoryName={'Transfer'}
        categoryGrey
        amount={operation.amount}
        accountName={null}
        currency={operation.currency}
        tags={operation.tags}
        comment={operation.comment}
        transferElement={<Row gap={1}>
            <DivBody2 flex={'0 1 auto'} noWrap>{operation.account.name}</DivBody2>
            <DivBody2><FontAwesomeIcon icon={faArrowRightLong} /></DivBody2>
            <DivBody2 flex={'0 1 auto'} noWrap>{operation.toAccount.name}</DivBody2>
        </Row>}
    />
}
