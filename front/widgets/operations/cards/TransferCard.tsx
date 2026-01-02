import { faArrowRightLong, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { type ReactElement } from 'react'

import { type TransferOperation } from '../../../../engine/model.js'
import { useEngine } from '../../../useEngine.js'
import { Row } from '../../generic/Containers.js'
import { DivBody2 } from '../../generic/Typography.js'
import { BaseOpCard } from './BaseOpCard.js'

interface Props {
    operation: TransferOperation
}

export function TransferCard({ operation }: Props): ReactElement {
    const engine = useEngine()

    return (
        <BaseOpCard
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
            transferElement={(
                <Row gap={1}>
                    <DivBody2 flex={'0 1 auto'} noWrap>{engine.getAccount(operation.account.id).name}</DivBody2>
                    <DivBody2><FontAwesomeIcon icon={faArrowRightLong} /></DivBody2>
                    <DivBody2 flex={'0 1 auto'} noWrap>{engine.getAccount(operation.toAccount.id).name}</DivBody2>
                </Row>
            )}
        />
    )
}
