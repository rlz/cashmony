import React, { useState, type ReactElement, useEffect } from 'react'
import { Box, Button, Skeleton, Typography, useTheme } from '@mui/material'
import { OperationsModel } from '../model/operations'
import { useParams } from 'react-router-dom'
import { type ExpenseOperation, type IncomeOperation, type NotDeletedOperation, type Operation } from '../model/model'
import { EditorAppBar } from '../widgets/EditorAppBar'
import { observer } from 'mobx-react-lite'
import { TagsEditor } from '../widgets/TagsEditor'
import { AccountEditor } from '../widgets/AccountEditor'
import { AmountEditor } from '../widgets/AmountEditor'
import { AccountsModel } from '../model/accounts'
import { CommentEditor } from '../widgets/CommentEditor'
import { DateEditor } from '../widgets/DateEditor'
import { CategoriesEditor } from '../widgets/CategoriesEditor'
import { CategoriesModel } from '../model/categories'
import { formatCurrency } from '../helpers/currencies'

const accountsModel = AccountsModel.instance()
const categoriesModel = CategoriesModel.instance()

export const OperationScreen = observer((): ReactElement => {
    const theme = useTheme()
    const [op, setOp] = useState<Operation | null>(null)
    const pathParams = useParams()

    useEffect(() => {
        const getData = async (): Promise<void> => {
            const op = await OperationsModel.instance().getOperation(pathParams.opId as string)
            setOp(op)
        }

        void getData()
    }, [])

    let body = <SkeletonScreen />

    if (op?.type === 'expense' || op?.type === 'income') {
        body = <ExpenseIncomeScreen op={op} setOp={setOp}/>
    }

    const title = op === null
        ? ''
        : op.type[0].toLocaleUpperCase() + op.type.substring(1)

    return <Box width="100vw" height="100vh" display="flex" flexDirection="column">
        <EditorAppBar
            title={title}
            navigateOnBack='/operations'
            onSave={() => { alert('Save!!') }}
        />
        <Box
            display="flex"
            flexDirection="column"
            overflow="scroll"
            flex="1 0 0"
            bgcolor={theme.palette.background.default}
        >
            {body}
        </Box>
    </Box>
})

interface ExpenseIncomeScreenProps {
    op: ExpenseOperation | IncomeOperation
    setOp: (op: ExpenseOperation | IncomeOperation) => void
}

function SkeletonScreen (): ReactElement {
    const theme = useTheme()

    return <Box px={1} color={theme.palette.getContrastText(theme.palette.background.default)}>
        <Box py={2}>
            <Skeleton width={90} sx={{ margin: '0 auto' }}/>
            <Skeleton width={180} height={48} sx={{ margin: '0 auto' }}/>
            <Skeleton width={190} sx={{ mt: 1 }}/>
            <Skeleton width={170} />
            <Skeleton width={230} sx={{ mt: 1 }}/>
            <Skeleton width={270}/>
        </Box>
        <Skeleton variant='rounded' sx={{ height: 32, marginBottom: 1 }}/>
        <Skeleton variant='rounded' sx={{ height: 32, marginBottom: 1 }} />
        <Skeleton variant='rounded' sx={{ height: 32, marginBottom: 1 }} />
        <Skeleton variant='rounded' sx={{ height: 32, marginBottom: 1 }} />
        <Skeleton variant='rounded' sx={{ height: 32, marginBottom: 1 }} />
        <Skeleton variant='rounded' sx={{ height: 32, marginBottom: 1 }} />
    </Box>
}

function ExpenseIncomeScreen ({ op, setOp }: ExpenseIncomeScreenProps): ReactElement {
    const theme = useTheme()
    const account = accountsModel.accounts[op.account.name]
    const category = op.categories.length === 1 ? categoriesModel.categories[op.categories[0].name] : null
    const categoryAmount = op.categories.length === 1 ? op.categories[0].amount : null
    const amountColor = op.type === 'expense' ? theme.palette.error.light : theme.palette.success.light

    const [expanded, setExpanded] = useState<
    'tags' | 'account' | 'amount' | 'comment' | 'date' | 'categories' | null
    >(null)

    return <Box px={1} color={theme.palette.getContrastText(theme.palette.background.default)}>
        <Box py={2}>
            <Typography variant='body2' textAlign='center'>
                {op.date.toLocaleString({ dateStyle: 'full' })}
            </Typography>
            <Typography variant='h4' textAlign='center' color={amountColor}>
                {Math.abs(op.amount).toLocaleString(undefined, {
                    style: 'currency',
                    currency: op.currency,
                    currencyDisplay: 'narrowSymbol'
                })}
            </Typography>
            <Typography variant='body2' mt={1}>
            Acc.: {op.account.name} ({formatCurrency(op.account.amount, account.currency)})
            </Typography>
            {
                op.categories.length === 1
                    ? <Typography variant='body2'>
                    Cat.: {op.categories[0].name} ({formatCurrency(categoryAmount ?? 0, category?.currency ?? '')})
                    </Typography>
                    : null
            }
            <Typography variant='body2' mt={1} color='primary.light' noWrap>
                {op.tags.join(', ')}
            </Typography>
            <Typography variant='body2' fontStyle='italic'>{op.comment}</Typography>
        </Box>
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
            onExpandedChange={(expanded) => { setExpanded(expanded ? 'amount' : null) }}
        />
        <DateEditor
            expanded={expanded === 'date'}
            onExpandedChange={(expanded) => { setExpanded(expanded ? 'date' : null) }}
            date={op.date}
            onDateChange={date => { setOp({ ...op, date }) }}
        />
        <AccountEditor
            opAmount={op.amount}
            opCurrency={op.currency}
            expanded={expanded === 'account'}
            onExpandedChange={(expanded) => { setExpanded(expanded ? 'account' : null) }}
            account={op.account}
            onAccountChange={account => { setOp(propagateAmount({ ...op, account })) }}
        />
        <CategoriesEditor
            opAmount={op.amount}
            opCurrency={op.currency}
            categories={op.categories}
            onCategoriesChange={categories => { setOp(propagateAmount({ ...op, categories })) }}
            expanded={expanded === 'categories'}
            onExpandedChange={(expanded) => { setExpanded(expanded ? 'categories' : null) }}
        />
        <TagsEditor
            expanded={expanded === 'tags'}
            onExpandedChange={(expanded) => { setExpanded(expanded ? 'tags' : null) }}
            tags={op.tags}
            opType={op.type}
            onTagsChanged={tags => { setOp({ ...op, tags }) } }
        />
        <CommentEditor
            expanded={expanded === 'comment'}
            onExpandedChange={(expanded) => { setExpanded(expanded ? 'comment' : null) }}
            comment={op.comment}
            onCommentChange={comment => { setOp({ ...op, comment }) }}
        />
        <Button sx={{ mt: 1 }} variant='contained' color='error' fullWidth>Delete</Button>
    </Box>
}

function propagateAmount<T extends NotDeletedOperation> (op: T): T {
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

    if (
        (op.type === 'expense' || op.type === 'income') &&
        op.categories.length === 1 &&
        op.categories[0].amount !== op.amount &&
        op.currency === categoriesModel.categories[op.categories[0].name].currency
    ) {
        op = {
            ...op,
            categories: [{
                ...op.categories[0],
                amount: op.amount
            }]
        }
    }

    return op
}
