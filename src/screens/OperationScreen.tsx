import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Skeleton, Typography, useTheme } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'
import { v1 as uuid } from 'uuid'

import { formatCurrency } from '../helpers/currencies'
import { utcToday } from '../helpers/dates'
import { deepEqual } from '../helpers/deepEqual'
import { runAsync } from '../helpers/smallTools'
import { screenWidthIs } from '../helpers/useWidth'
import { AccountsModel } from '../model/accounts'
import { AppState } from '../model/appState'
import { CurrenciesModel } from '../model/currencies'
import { type AdjustmentOperation, type DeletedOperation, type ExpenseOperation, type IncomeOperation, type NotDeletedOperation, type Operation, type TransferOperation } from '../model/model'
import { OperationsModel } from '../model/operations'
import { ActionFab } from '../widgets/generic/ActionButton'
import { ResizeHandle } from '../widgets/generic/resizeHandle'
import { PBody2 } from '../widgets/generic/Typography'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { DeleteOpButton } from '../widgets/operations/DeleteOpButton'
import { AccountEditor } from '../widgets/operations/editors/AccountEditor'
import { AmountEditor } from '../widgets/operations/editors/AmountEditor'
import { CategoriesEditor } from '../widgets/operations/editors/CategoriesEditor'
import { CommentEditor } from '../widgets/operations/editors/CommentEditor'
import { DateEditor } from '../widgets/operations/editors/DateEditor'
import { TagsEditor } from '../widgets/operations/editors/TagsEditor'
import { OpsList } from '../widgets/operations/OpsList'

const OPS_LIST_SX = { p: 1, overflow: 'auto', height: '100%' }

const appState = AppState.instance()
const operationsModel = OperationsModel.instance()
const accountsModel = AccountsModel.instance()
const currenciesModel = CurrenciesModel.instance()

type PartialOperation =
    Omit<IncomeOperation | ExpenseOperation, 'account'> |
    Omit<TransferOperation, 'account' | 'toAccount'> |
    Omit<AdjustmentOperation, 'account'>

export function OperationScreen (): ReactElement {
    const location = useLocation()
    const navigate = useNavigate()
    const pathParams = useParams()
    const smallScreen = screenWidthIs('xs', 'sm')

    useEffect(() => {
        appState.setOnClose(() => {
            navigate('/operations')
        })
    }, [])

    const opId = match(location.pathname)
        .with('/new-op/expense', () => 'new-expense')
        .with('/new-op/income', () => 'new-income')
        .with('/new-op/transfer', () => 'new-transfer')
        .otherwise(() => pathParams.opId ?? '')

    const body = <OperationScreenBody opId={opId}/>

    return <MainScreen>
        {
            !smallScreen
                ? <PanelGroup direction='horizontal'>
                    <Panel>
                        <OpsList
                            sx={OPS_LIST_SX} /* no re-render here */
                            noFab
                        />
                    </Panel>
                    <ResizeHandle/>
                    <Panel>
                        <Box p={1} overflow='auto' height='100%'>
                            {body}
                        </Box>
                    </Panel>
                </PanelGroup>
                : <Box p={1}>
                    {body}
                </Box>
        }
    </MainScreen>
}

interface BodyProps {
    opId: string
    setModalTitle?: (title: string) => void
}

export const OperationScreenBody = observer(function OperationScreenBody ({ opId, setModalTitle }: BodyProps): ReactElement {
    const navigate = useNavigate()
    const smallScreen = screenWidthIs('xs', 'sm')

    const [op, setOp] = useState<PartialOperation | DeletedOperation | null>(null)
    const [origOp, setOrigOp] = useState<PartialOperation | DeletedOperation | null>(null)
    const [account, setAccount] = useState<NotDeletedOperation['account'] | null>(null)
    const [origAccount, setOrigAccount] = useState<NotDeletedOperation['account'] | null>(null)
    const [toAccount, setToAccount] = useState<NotDeletedOperation['account'] | null>(null)
    const [origToAccount, setOrigToAccount] = useState<NotDeletedOperation['account'] | null>(null)

    const [expanded, setExpanded] = useState<
    'amount' | 'tags' | 'account' | 'toAccount' | 'comment' | 'date' | 'categories' | null
    >(null)

    useEffect(() => {
        setOp(null)
        setOrigOp(null)
        setAccount(null)
        setOrigAccount(null)
        setToAccount(null)
        setOrigToAccount(null)

        const setTitle = setModalTitle !== undefined ? setModalTitle : appState.setSubTitle

        if (opId === 'new-expense') {
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

            setTitle('Operations :: new :: expense')
        } else if (opId === 'new-income') {
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

            setTitle('Operations :: new :: income')
        } else if (opId === 'new-transfer') {
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

            setTitle('Operations :: new :: transfer')
        } else {
            setTitle('Operations :: loading...')

            runAsync(async (): Promise<void> => {
                const op = await operationsModel.getOperation(opId)
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

                setTitle(`Operations :: ${op.type}`)
            })
        }
    }, [opId, setModalTitle])

    useEffect(() => {
        setExpanded(location.pathname.startsWith('/new-op/') ? 'amount' : null)
    }, [location])

    const onSave = useMemo(
        () => {
            if (
                op === null ||
                op.type === 'deleted' ||
                op.amount === 0 ||
                account === null ||
                account.amount === 0 ||
                (op.type === 'transfer' && (toAccount === null || toAccount.amount === 0)) ||
                (deepEqual(op, origOp) && deepEqual(account, origAccount) && deepEqual(toAccount, origToAccount))
            ) {
                return null
            }

            return async () => {
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

                setOrigOp(op)
                setOrigAccount(account)
                setOrigToAccount(toAccount)

                if (opId.startsWith('new-')) {
                    if (smallScreen) {
                        navigate('/operations')
                    } else {
                        navigate(`/operations/${op.id}`)
                    }
                }
            }
        },
        [op, origOp, account, origAccount, toAccount, origToAccount, smallScreen]
    )

    if (
        op === null ||
        accountsModel.accounts === null ||
        accountsModel.amounts === null ||
        currenciesModel.rates === null
    ) {
        return <SkeletonBody />
    }

    if (op.type === 'deleted') {
        return <Typography variant='h5' mt={10} textAlign='center'>This operation was deleted</Typography>
    }

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
        <ActionFab
            action={onSave}
            bottom={setModalTitle !== undefined ? '20px' : undefined}
        >
            <FontAwesomeIcon icon={faCheck}/>
        </ActionFab>
        {
            location.pathname.startsWith('/new-op/')
                ? null
                : <DeleteOpButton onDelete={async () => {
                    const o: Operation = {
                        id: opId,
                        type: 'deleted'
                    }
                    await operationsModel.put([o])

                    setOp(o)
                    setOrigOp(o)
                    setAccount(null)
                    setOrigAccount(null)
                    setToAccount(null)
                    setOrigToAccount(null)

                    if (smallScreen && setModalTitle === undefined) {
                        navigate('/operations')
                    }
                }} />
        }
        <Box minHeight={128}/>
    </Box>
})

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
