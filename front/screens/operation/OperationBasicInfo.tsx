import { Typography, useTheme } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { ReactElement } from 'react'

import { BaseTransaction, NotDeletedOperation } from '../../../engine/model.js'
import { formatCurrency } from '../../helpers/currencies.js'
import { nonNull } from '../../helpers/smallTools.js'
import { useEngine } from '../../useEngine.js'

interface OperationBasicInfoProps {
    opType: NotDeletedOperation['type']
    opDate: DateTime
    opAmount: number
    opCurrency: string
    opCategories: readonly BaseTransaction[] | null
    opAccount: NotDeletedOperation['account'] | null
    opToAccount: NotDeletedOperation['account'] | null
    opTags: readonly string[]
    opComment: string | null
}

export const OperationBasicInfo = observer(({ opType, opDate, opAmount, opCurrency, opCategories, opAccount, opToAccount, opTags, opComment }: OperationBasicInfoProps): ReactElement => {
    const engine = useEngine()

    const theme = useTheme()

    const accountCurrency = opAccount !== null ? engine.getAccount(opAccount.id).currency : null
    const toAccountCurrency = opToAccount !== null ? engine.getAccount(opToAccount.id).currency : null

    const amountColor = {
        expense: theme.palette.error,
        income: theme.palette.success,
        transfer: theme.palette.info,
        adjustment: theme.palette.warning
    }[opType].light

    let categoryInfo: ReactElement | null = null
    if (opType === 'expense' || opType === 'income') {
        const opCats = nonNull(opCategories, 'not null opCategories expected here')

        if (opCats.length === 0) {
            categoryInfo = <Typography variant={'body2'}>{'Cat.: -'}</Typography>
        } else {
            categoryInfo = (
                <>
                    {
                        opCats
                            .map(c => (
                                <Typography key={c.id} variant={'body2'}>
                                    {`Cat.: ${engine.getCategory(c.id).name} (${formatCurrency(c.amount, opCurrency)})`}
                                </Typography>
                            ))
                    }
                </>
            )
        }
    }

    return (
        <>
            <Typography variant={'body2'} textAlign={'center'}>
                {opDate.toLocaleString({ dateStyle: 'full' })}
            </Typography>
            <Typography variant={'h4'} textAlign={'center'} color={amountColor}>
                {Math.abs(opAmount).toLocaleString(undefined, {
                    style: 'currency',
                    currency: opCurrency,
                    currencyDisplay: 'narrowSymbol'
                })}
            </Typography>
            <Typography variant={'body2'} mt={1}>
                {opType === 'transfer' ? 'From acc.: ' : 'Acc.: '}
                {
                    opAccount === null
                        ? '-'
                        : (
                                <>
                                    {engine.getAccount(opAccount.id).name}
                                    {
                                        accountCurrency === undefined || accountCurrency === null
                                            ? null
                                            : ` (${formatCurrency(opAccount.amount, accountCurrency)})`
                                    }
                                </>
                            )
                }
            </Typography>
            {
                opType === 'transfer'
                && (
                    <Typography variant={'body2'}>
                        {'To acc.: '}
                        {
                            opToAccount === null
                                ? '-'
                                : (
                                        <>
                                            {engine.getAccount(opToAccount.id).name}
                                            {
                                                opToAccount === null || toAccountCurrency === undefined || toAccountCurrency === null
                                                    ? null
                                                    : ` (${formatCurrency(opToAccount.amount, toAccountCurrency)})`
                                            }
                                        </>
                                    )
                        }
                    </Typography>
                )
            }
            {categoryInfo}
            <Typography variant={'body2'} mt={1} color={'primary.light'} noWrap>
                {opTags.join(', ')}
            </Typography>
            <Typography variant={'body2'} fontStyle={'italic'}>{opComment}</Typography>
        </>
    )
})
