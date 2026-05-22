import { faArrowRightLong, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Stack, Typography } from '@mui/material'
import React, { type ReactElement } from 'react'

import { type TransferOperation } from '../../../../engine/model.js'
import { useEngine } from '../../../useEngine.js'
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
                <Stack direction={'row'} sx={{ gap: 1 }}>
                    <Typography component={'div'} variant={'body2'} sx={{ flex: '0 1 auto' }} noWrap>{engine.getAccount(operation.account.id).name}</Typography>
                    <Typography component={'div'} variant={'body2'}><FontAwesomeIcon icon={faArrowRightLong} /></Typography>
                    <Typography component={'div'} variant={'body2'} sx={{ flex: '0 1 auto' }} noWrap>{engine.getAccount(operation.toAccount.id).name}</Typography>
                </Stack>
            )}
        />
    )
}
