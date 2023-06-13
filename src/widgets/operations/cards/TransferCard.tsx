import React, { type ReactElement } from 'react'
import { type TransferOperation } from '../../../model/model'
import { BaseOpCard } from './BaseOpCard'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightLong, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons'
import { Typography } from '@mui/material'

interface Props {
    operation: TransferOperation
}

export function TransferCard ({ operation }: Props): ReactElement {
    return <BaseOpCard
        opId={operation.id}
        color='info'
        icon={<FontAwesomeIcon icon={faMoneyBillTransfer}/>}
        categoryName="Transfer"
        categoryGrey
        amount={operation.amount}
        accountName={null}
        currency={operation.currency}
        tags={operation.tags}
        comment={operation.comment}
        transferElement={<Typography
            variant='body2'
            component="div"
        >
            {operation.account.name}
            {' '}<FontAwesomeIcon icon={faArrowRightLong} />{' '}
            {operation.toAccount.name}
        </Typography>}
    />
}
