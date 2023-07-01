import React, { useState, type ReactElement, useEffect, type PropsWithChildren } from 'react'
import { Box, Skeleton, Typography, useTheme } from '@mui/material'
import { OperationsModel } from '../model/operations'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { type ExpenseOperation, type DeletedOperation, type NotDeletedOperation, type IncomeOperation, type TransferOperation, type AdjustmentOperation, type Operation } from '../model/model'
import { observer } from 'mobx-react-lite'
import { TagsEditor } from '../widgets/operations/editors/TagsEditor'
import { AccountEditor } from '../widgets/operations/editors/AccountEditor'
import { AmountEditor } from '../widgets/operations/editors/AmountEditor'
import { AccountsModel } from '../model/accounts'
import { CommentEditor } from '../widgets/operations/editors/CommentEditor'
import { DateEditor } from '../widgets/operations/editors/DateEditor'
import { CategoriesEditor } from '../widgets/operations/editors/CategoriesEditor'
import { formatCurrency } from '../helpers/currencies'
import { v1 as uuid } from 'uuid'
import { DateTime } from 'luxon'
import { utcToday } from '../helpers/dates'
import { DeleteOpButton } from '../widgets/operations/DeleteOpButton'
import { CurrenciesModel } from '../model/currencies'
import { deepEqual } from '../helpers/deepEqual'
import { AppState } from '../model/appState'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { useWidth, widthOneOf } from '../helpers/useWidth'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { OpsList } from '../widgets/operations/OpsList'
import { ResizeHandle } from '../widgets/generic/resizeHandle'
import { PBody2 } from '../widgets/Typography'

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()
const accountsModel = AccountsModel.instance()
const currenciesModel = CurrenciesModel.instance()

type PartialOperation =
    Omit<IncomeOperation | ExpenseOperation, 'account'> |
    Omit<TransferOperation, 'account' | 'toAccount'> |
    Omit<AdjustmentOperation, 'account'>

export const OperationScreen = observer((): ReactElement => {
    const navigate = useNavigate()
    const [op, setOp] = useState<PartialOperation | DeletedOperation | null>(null)
    const [origOp, setOrigOp] = useState<PartialOperation | DeletedOperation | null>(null)
    const [account, setAccount] = useState<NotDeletedOperation['account'] | null>(null)
    const [origAccount, setOrigAccount] = useState<NotDeletedOperation['account'] | null>(null)
    const [toAccount, setToAccount] = useState<NotDeletedOperation['account'] | null>(null)
    const [origToAccount, setOrigToAccount] = useState<NotDeletedOperation['account'] | null>(null)
    const location = useLocation()
    const pathParams = useParams()
    const showOps = !widthOneOf(useWidth(), ['xs', 'sm'])

    useEffect(() => {
        setOp(null)
        setOrigOp(null)
        setAccount(null)
        setOrigAccount(null)
        setToAccount(null)
        setOrigToAccount(null)

        if (location.pathname.endsWith('expense')) {
            setOp({
                id: uuid(),
                type: 'expense',
                lastModified: DateTime.utc(),
                date: utcToday(),
                amount: 0,
                currency: currenciesModel.currencies[0],
                categories: [],
                tags: [],
                comment: null
            })
        } else if (location.pathname.endsWith('income')) {
            setOp({
                id: uuid(),
                type: 'income',
                lastModified: DateTime.utc(),
                date: utcToday(),
                amount: 0,
                currency: currenciesModel.currencies[0],
                categories: [],
                tags: [],
                comment: null
            })
        } else if (location.pathname.endsWith('transfer')) {
            setOp({
                id: uuid(),
                type: 'transfer',
                lastModified: DateTime.utc(),
                date: utcToday(),
                amount: 0,
                currency: currenciesModel.currencies[0],
                tags: [],
                comment: null
            })
        } else {
            const getData = async (): Promise<void> => {
                const op = await operationsModel.getOperation(pathParams.opId as string)
                setOp(op)
                setOrigOp(op)
                if (op.type !== 'deleted') {
                    setAccount(op.account)
                    setOrigAccount(op.account)
                }

                if (op.type === 'transfer') {
                    setToAccount(op.toAccount)
                    setOrigToAccount(op.toAccount)
                }
            }

            void getData()
        }
    }, [location])

    const onSave = op !== null &&
            op.type !== 'deleted' &&
            op.amount !== 0 &&
            account !== null &&
            account.amount !== 0 &&
            (op.type !== 'transfer' || (toAccount !== null && toAccount.amount !== 0)) &&
            !(deepEqual(op, origOp) && deepEqual(account, origAccount) && deepEqual(toAccount, origToAccount))
        ? async () => {
            if (op === null) {
                throw Error('Not null op expected here')
            }

            if (account === null) {
                throw Error('Not null account expected here')
            }

            if (op.type === 'transfer') {
                if (toAccount === null) {
                    throw Error('Not null toAccount expected here')
                }

                await operationsModel.put([{ ...op, lastModified: DateTime.utc(), account, toAccount }])
            } else {
                await operationsModel.put([{ ...op, lastModified: DateTime.utc(), account }])
            }

            if (!showOps) {
                navigate('/operations')
            } else if (location.pathname.startsWith('/new-op/')) {
                navigate(`/operations/${op.id}`)
            } else {
                setOrigOp(op)
                setOrigAccount(account)
                setOrigToAccount(toAccount)
            }
        }
        : null

    if (
        op === null ||
        accountsModel.accounts === null ||
        accountsModel.amounts === null ||
        currenciesModel.rates === null
    ) {
        return <Wrap
            showOps={showOps}
            op={op}
            onSave={null}
        >
            <SkeletonBody />
        </Wrap>
    }

    if (op.type === 'deleted') {
        return <Wrap
            showOps={showOps}
            op={op}
            onSave={undefined}
        >
            <Typography variant='h5' mt={10} textAlign='center'>This operation was deleted</Typography>
        </Wrap>
    }

    return <Wrap
        showOps={showOps}
        op={op}
        onSave={onSave}
    >
        <OpBody
            onDelete={async () => {
                const o: Operation = {
                    id: op.id,
                    type: 'deleted'
                }
                await operationsModel.put([o])

                if (!showOps) {
                    navigate('/operations')
                } else {
                    setOp(o)
                    setOrigOp(o)
                    setAccount(null)
                    setOrigAccount(null)
                    setToAccount(null)
                    setOrigToAccount(null)
                }
            }}
            op={op}
            setOp={setOp}
            account={account}
            setAccount={setAccount}
            toAccount={toAccount}
            setToAccount={setToAccount}/>
    </Wrap>
})

interface WrapProps extends PropsWithChildren {
    showOps: boolean
    op: PartialOperation | DeletedOperation | null
    onSave: (() => void) | null | undefined
}

const OPS_LIST_SX = { p: 1, overflow: 'auto', height: '100%' }

const Wrap = observer(({ showOps, op, onSave, children }: WrapProps): ReactElement => {
    const location = useLocation()
    const title = op === null
        ? ''
        : op.type[0].toLocaleUpperCase() + op.type.substring(1)

    return <MainScreen
        title={title}
        navigateOnBack='/operations'
        onSave={onSave}
    >
        {
            showOps
                ? <PanelGroup direction='horizontal'>
                    <Panel>
                        <OpsList
                            sx={OPS_LIST_SX} /* no re-render here */
                            noFab={location.pathname.startsWith('/new-op/')}
                        />
                    </Panel>
                    <ResizeHandle/>
                    <Panel>
                        <Box p={1} overflow='auto' height='100%'>
                            {children}
                        </Box>
                    </Panel>
                </PanelGroup>
                : <Box p={1}>
                    {children}
                </Box>
        }
    </MainScreen>
})

interface BodyProps {
    onDelete: () => Promise<void>
    op: PartialOperation
    setOp: (op: PartialOperation | DeletedOperation) => void
    account: NotDeletedOperation['account'] | null
    setAccount: (account: NotDeletedOperation['account'] | null) => void
    toAccount: NotDeletedOperation['account'] | null
    setToAccount: (account: NotDeletedOperation['account'] | null) => void
}

function OpBody ({ onDelete, op, setOp, account, setAccount, toAccount, setToAccount }: BodyProps): ReactElement {
    const location = useLocation()

    const [expanded, setExpanded] = useState<
    'amount' | 'tags' | 'account' | 'toAccount' | 'comment' | 'date' | 'categories' | null
    >(null)

    useEffect(() => {
        setExpanded(location.pathname.startsWith('/new-op/') ? 'amount' : null)
    }, [location])

    const propagateAndSave = (
        op: PartialOperation,
        account: NotDeletedOperation['account'] | null,
        toAccount: NotDeletedOperation['account'] | null
    ): void => {
        const [prOp, prAccount, prToAccount] = propagateAmount(op, account, toAccount)
        setOp(prOp)
        setAccount(prAccount)
        setToAccount(prToAccount)
    }

    return <Box>
        <Box pt={1} pb={2}>
            <BasicInfo op={op} account={account} toAccount={toAccount}/>
        </Box>
        <AmountEditor
            amount={op.amount}
            negative={op.type === 'expense'}
            currency={op.currency}
            expanded={expanded === 'amount'}
            onCurrencyChange={currency => {
                propagateAndSave({ ...op, currency }, account, toAccount)
            }}
            onAmountChange={amount => {
                propagateAndSave({ ...op, amount }, account, toAccount)
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
            title={op.type === 'transfer' ? 'From account' : 'Account'}
            opAmount={op.amount}
            negative={op.type === 'expense' || op.type === 'transfer'}
            opCurrency={op.currency}
            expanded={expanded === 'account'}
            onExpandedChange={(expanded) => { setExpanded(expanded ? 'account' : null) }}
            account={account}
            onAccountChange={account => { propagateAndSave(op, account, toAccount) }}
            hideAccount={op.type === 'transfer' ? toAccount?.name : undefined}
        />
        {
            op.type === 'transfer'
                ? <>
                    <AccountEditor
                        title='To account'
                        opAmount={op.amount}
                        negative={false}
                        opCurrency={op.currency}
                        expanded={expanded === 'toAccount'}
                        onExpandedChange={(expanded) => { setExpanded(expanded ? 'toAccount' : null) }}
                        account={toAccount}
                        onAccountChange={toAccount => {
                            propagateAndSave(op, account, toAccount)
                        }}
                        hideAccount={account?.name}
                    /></>
                : null
        }
        {
            op.type === 'expense' || op.type === 'income'
                ? <CategoriesEditor
                    expanded={expanded === 'categories'}
                    onExpandedChange={(expanded) => { setExpanded(expanded ? 'categories' : null) }}
                    opAmount={op.amount}
                    negative={op.type === 'expense'}
                    opCurrency={op.currency}
                    categories={op.categories}
                    onCategoriesChange={categories => {
                        propagateAndSave({ ...op, categories }, account, toAccount)
                    }}
                />
                : null
        }
        <TagsEditor
            expanded={expanded === 'tags'}
            onExpandedChange={(expanded) => { setExpanded(expanded ? 'tags' : null) }}
            categories={op.type === 'income' || op.type === 'expense' ? op.categories.map(c => c.name) : []}
            tags={op.tags}
            opType={op.type}
            onTagsChanged={tags => { setOp({ ...op, tags }) }}
        />
        <CommentEditor
            expanded={expanded === 'comment'}
            onExpandedChange={(expanded) => { setExpanded(expanded ? 'comment' : null) }}
            comment={op.comment}
            onCommentChange={comment => { setOp({ ...op, comment }) }}
        />
        {
            location.pathname.startsWith('/new-op/')
                ? null
                : <DeleteOpButton onDelete={onDelete} />
        }
        <Box minHeight={72}/>
    </Box>
}

function SkeletonBody (): ReactElement {
    const theme = useTheme()

    return <Box px={1} color={theme.palette.getContrastText(theme.palette.background.default)}>
        <Box py={2}>
            <PBody2>
                <Skeleton width={90} sx={{ margin: '0 auto' }} />
            </PBody2>
            <Typography variant='h4'>
                <Skeleton width={180} sx={{ margin: '0 auto' }} />
            </Typography>
            <PBody2 mt={1}>
                <Skeleton width={190} />
                <Skeleton width={170} />
                <Skeleton width={230} sx={{ mt: 1 }} />
                <Skeleton width={270} />
            </PBody2>
        </Box>
        <Skeleton variant='rounded' sx={{ height: 48, mb: '1px' }} />
        <Skeleton variant='rounded' sx={{ height: 48, mb: '1px' }} />
        <Skeleton variant='rounded' sx={{ height: 48, mb: '1px' }} />
        <Skeleton variant='rounded' sx={{ height: 48, mb: '1px' }} />
        <Skeleton variant='rounded' sx={{ height: 48, mb: '1px' }} />
        <Skeleton variant='rounded' sx={{ height: 48, mb: '1px' }} />
        <Skeleton variant='rounded' sx={{ height: 36, mt: 2 }} />
    </Box>
}

function propagateAmount<T extends PartialOperation> (
    op: T,
    account: NotDeletedOperation['account'] | null,
    toAccount: NotDeletedOperation['account'] | null
): [T, NotDeletedOperation['account'] | null, NotDeletedOperation['account'] | null] {
    if (
        account !== null &&
        op.amount !== account.amount &&
        op.currency === accountsModel.get(account.name).currency
    ) {
        account = {
            ...account,
            amount: op.type === 'transfer' ? -op.amount : op.amount
        }
    }

    if (
        op.type === 'transfer' &&
        toAccount !== null &&
        op.amount !== toAccount.amount &&
        op.currency === accountsModel.get(toAccount.name).currency
    ) {
        toAccount = {
            ...toAccount,
            amount: op.amount
        }
    }

    if (
        (op.type === 'expense' || op.type === 'income') &&
        op.categories.length === 1 &&
        op.categories[0].amount !== op.amount
    ) {
        op = {
            ...op,
            categories: [{
                ...op.categories[0],
                amount: op.amount
            }]
        }
    }

    return [op, account, toAccount]
}

interface BasicInfoProps {
    op: PartialOperation
    account: NotDeletedOperation['account'] | null
    toAccount: NotDeletedOperation['account'] | null
}

const BasicInfo = observer(({ op, account, toAccount }: BasicInfoProps): ReactElement => {
    const theme = useTheme()

    const accountCurrency = account !== null ? accountsModel.get(account.name).currency : null
    const toAccountCurrency = toAccount !== null ? accountsModel.get(toAccount.name).currency : null

    const amountColor = {
        expense: theme.palette.error,
        income: theme.palette.success,
        transfer: theme.palette.info,
        adjustment: theme.palette.warning
    }[op.type].light

    let categoryInfo: ReactElement | null = null
    if (op.type === 'expense' || op.type === 'income') {
        if (op.categories.length === 0) {
            categoryInfo = <Typography variant='body2'>Cat.: -</Typography>
        } else {
            categoryInfo = <>{
                op.categories
                    .map(c => <Typography key={c.name} variant='body2'>
                        Cat.: {c.name} ({
                            formatCurrency(
                                c.amount * currenciesModel.getRate(op.date, op.currency, appState.masterCurrency),
                                appState.masterCurrency
                            )})
                    </Typography>)
            }</>
        }
    }

    return <>
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
            {op.type === 'transfer' ? 'From acc.: ' : 'Acc.: '}
            {
                account === null
                    ? '-'
                    : <>
                        {account.name}
                        {
                            accountCurrency === undefined || accountCurrency === null
                                ? null
                                : ` (${formatCurrency(account.amount, accountCurrency)})`
                        }
                    </>
            }
        </Typography>
        {
            op.type === 'transfer'
                ? <Typography variant='body2'>
                    To acc.: {toAccount?.name ?? '-'}
                    {
                        toAccount === null || toAccountCurrency === undefined || toAccountCurrency === null
                            ? null
                            : ` (${formatCurrency(toAccount.amount, toAccountCurrency)})`
                    }
                </Typography>
                : null
        }
        {categoryInfo}
        <Typography variant='body2' mt={1} color='primary.light' noWrap>
            {op.tags.join(', ')}
        </Typography>
        <Typography variant='body2' fontStyle='italic'>{op.comment}</Typography>
    </>
})
