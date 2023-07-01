import React, { type ReactElement } from 'react'
import { type TransferOperation } from '../../../model/model'
import { BaseOpCard } from './BaseOpCard'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightLong, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons'
import { Row } from '../../Containers'
import { DivBody2 } from '../../Typography'

interface Props {
    operation: TransferOperation
}

export function TransferCard ({ operation }: Props): ReactElement {
    return <BaseOpCard
        opId={operation.id}
        color='info'
        icon={<FontAwesomeIcon icon={faMoneyBillTransfer}/>}
        categoryName='Transfer'
        categoryGrey
        amount={operation.amount}
        accountName={null}
        currency={operation.currency}
        tags={operation.tags}
        comment={operation.comment}
        transferElement={<Row gap={1}>
            <DivBody2 flex='0 1 auto' noWrap>{operation.account.name}</DivBody2>
            <DivBody2><FontAwesomeIcon icon={faArrowRightLong} /></DivBody2>
            <DivBody2 flex='0 1 auto' noWrap>{operation.toAccount.name}</DivBody2>
        </Row>}
    />
}
