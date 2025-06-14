import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Skeleton, Typography, useTheme } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { useLocation, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'
import { uuidv7 } from 'uuidv7'

import { utcToday } from '../../engine/dates'
import { Engine } from '../../engine/engine'
import { type BaseTransaction, type NotDeletedOperation, type Operation } from '../../engine/model'
import { sortCurrencies } from '../../engine/sortCurrencies'
import { formatCurrency } from '../helpers/currencies'
import { deepEqual } from '../helpers/deepEqual'
import { nonNull, run, runAsync, showIfLazy } from '../helpers/smallTools'
import { screenWidthIs } from '../helpers/useWidth'
import { useFrontState } from '../model/FrontState'
import { useAbsoluteNavigate } from '../useAbsoluteNavigate'
import { useEngine } from '../useEngine'
import { ActionButton, ActionFab } from '../widgets/generic/ActionButton'
import { ResizeHandle } from '../widgets/generic/resizeHandle'
import { PBody2 } from '../widgets/generic/Typography'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { AddOperationFab } from '../widgets/operations/AddOperationFab'
import { AccountEditor } from '../widgets/operations/editors/AccountEditor'
import { AmountEditor } from '../widgets/operations/editors/AmountEditor'
import { CategoriesEditor } from '../widgets/operations/editors/CategoriesEditor'
import { CommentEditor } from '../widgets/operations/editors/CommentEditor'
import { DateEditor } from '../widgets/operations/editors/DateEditor'
import { TagsEditor } from '../widgets/operations/editors/TagsEditor'
import { OpsList } from '../widgets/operations/OpsList'

export function OperationScreen(): ReactElement {
    const appState = useFrontState()

    const location = useLocation()
    const navigate = useAbsoluteNavigate()
    const pathParams = useParams()
    const smallScreen = screenWidthIs('xs', 'sm')
    const theme = useTheme()

    const opId = match(location.pathname)
        .with('/new-op/expense', () => 'new-expense')
        .with('/new-op/income', () => 'new-income')
        .with('/new-op/transfer', () => 'new-transfer')
        .otherwise(() => pathParams.opId ?? '')

    useEffect(() => {
        if (opId === '') {
            appState.setSubTitle('Operations')
            appState.setOnClose(null)
            return
        }

        appState.setOnClose(() => {
            navigate('/operations')
        })
    }, [opId])

    return (
        <MainScreen>
            {
                !smallScreen
                    ? (
                            <PanelGroup direction={'horizontal'}>
                                <Panel id={'list'} order={1}>
                                    <Box height={'100%'} overflow={'auto'}>
                                        <Box p={1} height={'100%'} maxWidth={900} mx={'auto'}>
                                            <OpsList />
                                            { opId === '' && <AddOperationFab /> }
                                        </Box>
                                    </Box>
                                </Panel>
                                {
                                    showIfLazy(opId !== '', () => (
                                        <>
                                            <ResizeHandle />
                                            <Panel id={'single'} order={2}>
                                                <Box p={1} overflow={'auto'} height={'100%'}>
                                                    <OperationScreenBody urlOpId={opId} />
                                                </Box>
                                            </Panel>
                                        </>
                                    ))
                                }
                            </PanelGroup>
                        )
                    : (
                            <Box position={'relative'} height={'100%'}>
                                <Box p={1} height={'100%'} overflow={'auto'}>
                                    <OpsList />
                                    { opId === '' && <AddOperationFab /> }
                                </Box>
                                {
                                    showIfLazy(opId !== '', () => {
                                        return (
                                            <Box
                                                p={1}
                                                position={'absolute'}
                                                top={0}
                                                left={0}
                                                width={'100%'}
                                                height={'100%'}
                                                bgcolor={theme.palette.background.default}
                                            >
                                                <OperationScreenBody urlOpId={opId} />
                                            </Box>
                                        )
                                    })
                                }
                            </Box>
                        )
            }
        </MainScreen>
    )
}

interface BodyProps {
    urlOpId: string
    setModalTitle?: (title: string) => void
}

export const OperationScreenBody = observer(function OperationScreenBody({ urlOpId, setModalTitle }: BodyProps): ReactElement {
    const appState = useFrontState()

    const engine = useEngine()
    const navigate = useAbsoluteNavigate()
    const smallScreen = screenWidthIs('xs', 'sm')

    const [opId, setOpId] = useState<string | null>(null)
    const [opType, setOpType] = useState<Operation['type'] | null>(null)
    const [opDate, setOpDate] = useState<DateTime | null>(null)
    const [origOpDate, setOrigOpDate] = useState<DateTime | null>(null)
    const [opAmount, setOpAmount] = useState<number | null>(null)
    const [origOpAmount, setOrigOpAmount] = useState<number | null>(null)
    const [opCurrency, setOpCurrency] = useState<string | null>(null)
    const [origOpCurrency, setOrigOpCurrency] = useState<string | null>(null)
    const [opAccount, setOpAccount] = useState<BaseTransaction | null>(null)
    const [origOpAccount, setOrigOpAccount] = useState<BaseTransaction | null>(null)
    const [opToAccount, setOpToAccount] = useState<BaseTransaction | null>(null)
    const [origOpToAccount, setOrigOpToAccount] = useState<BaseTransaction | null>(null)
    const [opCategories, setOpCategories] = useState<readonly BaseTransaction[] | null>(null)
    const [origOpCategories, setOrigOpCategories] = useState<readonly BaseTransaction[] | null>(null)
    const [opTags, setOpTags] = useState<readonly string[] | null>(null)
    const [origOpTags, setOrigOpTags] = useState<readonly string[] | null>(null)
    const [opComment, setOpComment] = useState<string | null>(null)
    const [origOpComment, setOrigOpComment] = useState<string | null>(null)

    const clearOpState = (): void => {
        setOpId(null)
        setOpType(null)
        setOpDate(null)
        setOrigOpDate(null)
        setOpAmount(null)
        setOrigOpAmount(null)
        setOpCurrency(null)
        setOrigOpCurrency(null)
        setOpAccount(null)
        setOrigOpAccount(null)
        setOpToAccount(null)
        setOrigOpToAccount(null)
        setOpCategories(null)
        setOrigOpCategories(null)
        setOpTags(null)
        setOrigOpTags(null)
        setOpComment(null)
        setOrigOpComment(null)
    }

    const clearOpDiff = (): void => {
        setOrigOpDate(opDate)
        setOrigOpAmount(opAmount)
        setOrigOpCurrency(opCurrency)
        setOrigOpAccount(opAccount)
        setOrigOpToAccount(opToAccount)
        setOrigOpCategories(opCategories)
        setOrigOpTags(opTags)
        setOrigOpComment(opComment)
    }

    const isChanged = (): boolean => (
        opDate?.toMillis() !== origOpDate?.toMillis()
        || opAmount !== origOpAmount
        || opCurrency !== origOpCurrency
        || !deepEqual(opAccount, origOpAccount)
        || !deepEqual(opToAccount, origOpToAccount)
        || !deepEqual(opCategories, origOpCategories)
        || !deepEqual(opTags, origOpTags)
        || !deepEqual(opComment, origOpComment)
    )

    const [expanded, setExpanded] = useState<
    'amount' | 'tags' | 'account' | 'toAccount' | 'comment' | 'date' | 'categories' | null
    >(null)

    useEffect(() => {
        clearOpState()

        const setTitle = setModalTitle ?? appState.setSubTitle

        if (urlOpId.startsWith('new-')) {
            // TODO: re-use id of deleted operations here after removing sync with Google
            setOpId(uuidv7())
            setOpDate(utcToday())
            setOpAmount(0)
            setOpCurrency(sortCurrencies(engine)[0])
            setOpTags([])
        }

        if (urlOpId === 'new-expense') {
            setOpType('expense')
            setOpCategories([])

            setTitle('Operations :: new :: expense')
        } else if (urlOpId === 'new-income') {
            setOpType('income')
            setOpCategories([])

            setTitle('Operations :: new :: income')
        } else if (urlOpId === 'new-transfer') {
            setOpType('transfer')

            setTitle('Operations :: new :: transfer')
        } else {
            setTitle('Operations :: loading...')

            runAsync(async (): Promise<void> => {
                const op = engine.getOperation(urlOpId)

                setOpId(op.id)
                setOpType(op.type)
                setTitle(`Operations :: ${op.type}`)

                if (op.type === 'deleted') {
                    return
                }

                setOpDate(op.date)
                setOrigOpDate(op.date)
                setOpAmount(op.amount)
                setOrigOpAmount(op.amount)
                setOpCurrency(op.currency)
                setOrigOpCurrency(op.currency)
                setOpAccount(op.account)
                setOrigOpAccount(op.account)
                setOpToAccount(null)
                setOrigOpToAccount(null)
                setOpTags(op.tags)
                setOrigOpTags(op.tags)
                setOpComment(op.comment)
                setOrigOpComment(op.comment)

                if (op.type === 'expense' || op.type === 'income') {
                    setOpCategories(op.categories)
                    setOrigOpCategories(op.categories)
                }

                if (op.type === 'transfer') {
                    setOpToAccount(op.toAccount)
                    setOrigOpToAccount(op.toAccount)
                }
            })
        }
    }, [urlOpId, setModalTitle])

    useEffect(() => {
        setExpanded(location.pathname.startsWith('/new-op/') ? 'amount' : null)
    }, [location])

    const onSave = useMemo(
        () => {
            if (
                opType === 'deleted'
                || opAmount === 0
                || opAccount === null
                || opAccount.amount === 0
                || (opType === 'transfer' && (opToAccount === null || opToAccount.amount === 0))
                || (!isChanged())
            ) {
                return null
            }

            return () => {
                if (
                    opId === null
                    || opType === null
                    || opDate === null
                    || opAmount === null
                    || opCurrency === null
                    || opAccount === null
                    || (opType === 'transfer' && opToAccount === null)
                    || ((opType === 'expense' || opType === 'income') && opCategories === null)
                    || opTags === null
                ) {
                    throw Error('Not null fields expected here')
                }

                const op = run((): NotDeletedOperation => {
                    const op = {
                        id: opId,
                        lastModified: DateTime.utc(),
                        date: opDate,
                        amount: opAmount,
                        currency: opCurrency,
                        account: opAccount,
                        tags: opTags,
                        comment: opComment
                    }

                    if (opType === 'expense' || opType === 'income') {
                        return { ...op, type: opType, categories: opCategories! }
                    }

                    if (opType === 'transfer') {
                        return { ...op, type: opType, toAccount: opToAccount! }
                    }

                    return { ...op, type: opType }
                })

                engine.pushOperation(op)

                clearOpDiff()

                if (urlOpId.startsWith('new-')) {
                    appState.setOnClose(null)
                    if (smallScreen) {
                        navigate('/operations')
                    } else {
                        navigate(`/operations/${op.id}`)
                    }
                }
            }
        },
        [
            opId,
            opType,
            opDate,
            origOpDate,
            opAmount,
            origOpAmount,
            opCurrency,
            origOpCurrency,
            opAccount,
            origOpAccount,
            opToAccount,
            origOpToAccount,
            opCategories,
            origOpCategories,
            opTags,
            origOpTags,
            opComment,
            origOpComment,
            smallScreen
        ]
    )

    const onTagsExpandedChange = useMemo(() => {
        return (expanded: boolean) => { setExpanded(expanded ? 'tags' : null) }
    }, [])

    const tagsCategories = useMemo(() => {
        return opType === 'income' || opType === 'expense' ? opCategories?.map(c => c.id) ?? [] : []
    }, [opType, opCategories?.map(c => c.id).sort().join('|')])

    if (
        opId === null
        || opType === null
        || opType === 'deleted'
        || opDate === null
        || opAmount === null
        || opCurrency === null
        || opTags === null
    ) {
        if (opType === 'deleted') {
            return <Typography variant={'h5'} mt={10} textAlign={'center'}>{'This operation was deleted'}</Typography>
        }
        return <SkeletonBody />
    }

    const propagateAndSave = (
        amount: number,
        currency: string,
        categories: readonly BaseTransaction[] | null,
        account: NotDeletedOperation['account'] | null,
        toAccount: NotDeletedOperation['account'] | null
    ): void => {
        const [prCategories, prAccount, prToAccount] = propagateAmount(
            engine,
            opType,
            amount,
            currency,
            categories,
            account,
            toAccount
        )
        setOpAmount(amount)
        setOpCurrency(currency)
        setOpCategories(prCategories)
        setOpAccount(prAccount)
        setOpToAccount(prToAccount)
    }

    return (
        <Box>
            <Box pt={1} pb={2}>
                <BasicInfo
                    opType={opType}
                    opDate={opDate}
                    opAmount={opAmount}
                    opCurrency={opCurrency}
                    opAccount={opAccount}
                    opToAccount={opToAccount}
                    opCategories={opCategories}
                    opTags={opTags}
                    opComment={opComment}
                />
            </Box>
            <AmountEditor
                amount={opAmount}
                negative={opType === 'expense'}
                currency={opCurrency}
                expanded={expanded === 'amount'}
                onCurrencyChange={(currency) => {
                    propagateAndSave(opAmount, currency, opCategories, opAccount, opToAccount)
                }}
                onAmountChange={(amount) => {
                    propagateAndSave(amount, opCurrency, opCategories, opAccount, opToAccount)
                }}
                onExpandedChange={(expanded) => { setExpanded(expanded ? 'amount' : null) }}
            />
            <DateEditor
                expanded={expanded === 'date'}
                onExpandedChange={(expanded) => { setExpanded(expanded ? 'date' : null) }}
                date={opDate}
                onDateChange={setOpDate}
            />
            <AccountEditor
                title={opType === 'transfer' ? 'From account' : 'Account'}
                opAmount={opAmount}
                negative={opType === 'expense' || opType === 'transfer'}
                opCurrency={opCurrency}
                expanded={expanded === 'account'}
                onExpandedChange={(expanded) => { setExpanded(expanded ? 'account' : null) }}
                account={opAccount}
                onAccountChange={(account) => { propagateAndSave(opAmount, opCurrency, opCategories, account, opToAccount) }}
                hideAccount={opType === 'transfer' ? opToAccount?.id : undefined}
            />
            {
                opType === 'transfer'
                    ? (
                            <>
                                <AccountEditor
                                    title={'To account'}
                                    opAmount={opAmount}
                                    negative={false}
                                    opCurrency={opCurrency}
                                    expanded={expanded === 'toAccount'}
                                    onExpandedChange={(expanded) => { setExpanded(expanded ? 'toAccount' : null) }}
                                    account={opToAccount}
                                    onAccountChange={(toAccount) => {
                                        propagateAndSave(opAmount, opCurrency, opCategories, opAccount, toAccount)
                                    }}
                                    hideAccount={opAccount?.id}
                                />
                            </>
                        )
                    : null
            }
            {
                opType === 'expense' || opType === 'income'
                    ? (
                            <CategoriesEditor
                                expanded={expanded === 'categories'}
                                onExpandedChange={(expanded) => { setExpanded(expanded ? 'categories' : null) }}
                                opAmount={opAmount}
                                negative={opType === 'expense'}
                                opCurrency={opCurrency}
                                categories={nonNull(opCategories, 'non null opCAtegories expected here')}
                                onCategoriesChange={(categories) => {
                                    propagateAndSave(opAmount, opCurrency, categories, opAccount, opToAccount)
                                }}
                            />
                        )
                    : null
            }
            <TagsEditor
                expanded={expanded === 'tags'}
                onExpandedChange={onTagsExpandedChange}
                categories={tagsCategories}
                tags={opTags}
                opType={opType}
                onTagsChanged={setOpTags}
            />
            <CommentEditor
                expanded={expanded === 'comment'}
                onExpandedChange={(expanded) => { setExpanded(expanded ? 'comment' : null) }}
                comment={opComment}
                onCommentChange={setOpComment}
            />
            <ActionFab
                action={onSave}
                bottom={setModalTitle !== undefined ? '20px' : undefined}
            >
                <FontAwesomeIcon icon={faCheck} />
            </ActionFab>
            {
                location.pathname.startsWith('/new-op/')
                    ? null
                    : (
                            <ActionButton
                                variant={'contained'}
                                fullWidth
                                color={'error'}
                                sx={{ mt: 4 }}
                                confirmation={'Are you sure that you want to delete this operation?'}
                                action={() => {
                                    clearOpState()
                                    setOpId(urlOpId)
                                    setOpType('deleted')
                                    engine.pushOperation({ id: urlOpId, type: 'deleted', lastModified: DateTime.utc() })

                                    if (smallScreen && setModalTitle === undefined) {
                                        // todo: fix navigation from non operation screens
                                        navigate('/operations')
                                    }
                                }}
                            >
                                {'Delete'}
                            </ActionButton>
                        )
            }
            <Box minHeight={128} />
        </Box>
    )
})

function SkeletonBody(): ReactElement {
    const theme = useTheme()

    return (
        <Box px={1} color={theme.palette.getContrastText(theme.palette.background.default)}>
            <Box py={2}>
                <PBody2>
                    <Skeleton width={90} sx={{ margin: '0 auto' }} />
                </PBody2>
                <Typography variant={'h4'}>
                    <Skeleton width={180} sx={{ margin: '0 auto' }} />
                </Typography>
                <PBody2 mt={1}>
                    <Skeleton width={190} />
                    <Skeleton width={170} />
                    <Skeleton width={230} sx={{ mt: 1 }} />
                    <Skeleton width={270} />
                </PBody2>
            </Box>
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 48, mb: '1px' }} />
            <Skeleton variant={'rounded'} sx={{ height: 36, mt: 2 }} />
        </Box>
    )
}

function propagateAmount(
    engine: Engine,
    opType: string,
    opAmount: number,
    opCurrency: string,
    opCategories: readonly BaseTransaction[] | null,
    opAccount: BaseTransaction | null,
    opToAccount: BaseTransaction | null
): [readonly BaseTransaction[] | null, BaseTransaction | null, BaseTransaction | null] {
    if (
        opAccount !== null
        && opAmount !== opAccount.amount
        && opCurrency === engine.getAccount(opAccount.id).currency
    ) {
        opAccount = {
            ...opAccount,
            amount: opType === 'transfer' ? -opAmount : opAmount
        }
    }

    if (
        opType === 'transfer'
        && opToAccount !== null
        && opAmount !== opToAccount.amount
        && opCurrency === engine.getAccount(opToAccount.id).currency
    ) {
        opToAccount = {
            ...opToAccount,
            amount: opAmount
        }
    }

    if (
        opCategories !== null
        && opCategories.length === 1
        && opCategories[0].amount !== opAmount
    ) {
        opCategories = [{
            ...opCategories[0],
            amount: opAmount
        }]
    }

    return [opCategories, opAccount, opToAccount]
}

interface BasicInfoProps {
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

const BasicInfo = observer(({ opType, opDate, opAmount, opCurrency, opCategories, opAccount, opToAccount, opTags, opComment }: BasicInfoProps): ReactElement => {
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
