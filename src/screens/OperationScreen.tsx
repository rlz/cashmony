import React, { useState, type ReactElement, useEffect } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import { OperationsModel } from '../model/operations'
import { useParams } from 'react-router-dom'
import { type NotDeletedOperation, type Operation } from '../model/model'
import { EditorAppBar } from '../widgets/EditorAppBar'
import { observer } from 'mobx-react-lite'
import { TagsEditor } from '../widgets/TagsEditor'
import { AccountEditor } from '../widgets/AccountEditor'
import { AmountEditor } from '../widgets/AmountEditor'
import { AccountsModel } from '../model/accounts'

const accountsModel = AccountsModel.instance()

export const OperationScreen = observer((): ReactElement => {
    const theme = useTheme()
    const [op, setOp] = useState<Operation | null>(null)
    const pathParams = useParams()
    const [expanded, setExpanded] = useState<'tags' | 'account' | 'amount' | ''>('')

    useEffect(() => {
        console.log('Edit Operation', op)
    }, [op])

    useEffect(() => {
        const getData = async (): Promise<void> => {
            const op = await OperationsModel.instance().getOperation(pathParams.opId as string)
            setOp(op)
        }

        void getData()
    }, [])

    if (op?.type === 'expense') {
        return <Box width="100vw" height="100vh" display="flex" flexDirection="column">
            <EditorAppBar
                title='Expense'
                navigateOnBack='/operations'
                onSave={() => { alert('Save!!') }}
            />
            <Box
                display="flex"
                flexDirection="column"
                textOverflow="scroll"
                flex="1 0 0"
                bgcolor={theme.palette.background.default}
            >
                <Box p={1} color={theme.palette.getContrastText(theme.palette.background.default)}>
                    <Typography variant='h3' my={2} color={theme.palette.error.light}>
                        {Math.abs(op.amount).toLocaleString(undefined, {
                            style: 'currency',
                            currency: op.currency,
                            currencyDisplay: 'narrowSymbol'
                        })}
                    </Typography>
                    <AmountEditor
                        amount={op.amount}
                        currency={op.currency}
                        expanded={expanded === 'amount'}
                        onCurrencyChange={currency => {
                            setOp({
                                ...op,
                                currency
                            })
                        }}
                        onAmountChange={amount => {
                            setOp(propagateAmount({
                                ...op,
                                amount
                            }))
                        }}
                        onExpandedChange={(expanded) => { setExpanded(expanded ? 'amount' : '') }}
                    />
                    <AccountEditor
                        opAmount={op.amount}
                        opCurrency={op.currency}
                        expanded={expanded === 'account'}
                        onExpandedChange={(expanded) => { setExpanded(expanded ? 'account' : '') }}
                        account={op.account}
                        onAccountChange={account => { setOp(propagateAmount({ ...op, account })) }}
                    />
                    <TagsEditor
                        expanded={expanded === 'tags'}
                        onExpandedChange={(expanded) => { setExpanded(expanded ? 'tags' : '') }}
                        tags={op.tags}
                        opType={op.type}
                        onTagsChanged={tags => { setOp({ ...op, tags }) } }
                    />
                </Box>
            </Box>
        </Box>
    }

    return <>Unsupported type: {op?.type}</>
})

function propagateAmount (op: NotDeletedOperation): NotDeletedOperation {
    if (
        op.amount !== op.account.amount &&
        op.currency === accountsModel.accounts[op.account.name].currency
    ) {
        op = {
            ...op,
            account: {
                ...op.account,
                amount: op.amount
            }
        }
    }

    return op
}
