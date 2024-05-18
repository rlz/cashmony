import { Box, Skeleton, Tab, Tabs, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { ReactElement, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'
import { uuidv7 } from 'uuidv7'

import { CustomTimeSpan } from '../../../engine/dates'
import { Account } from '../../../engine/model'
import { PE } from '../../../engine/predicateExpression'
import { AccountsStatsReducer } from '../../../engine/stats/AccountsStatsReducer'
import { AccountStatsReducer } from '../../../engine/stats/AccountStatsReducer'
import { TotalAndChangeStats } from '../../../engine/stats/model'
import { calcStats2 } from '../../../engine/stats/newStatsProcessor'
import { formatCurrency } from '../../helpers/currencies'
import { nonNull, run, showIfLazy } from '../../helpers/smallTools'
import { useAppState } from '../../model/AppState'
import { useCurrenciesLoader } from '../../useCurrenciesLoader'
import { useEngine } from '../../useEngine'
import { FullScreenModal } from '../../widgets/FullScreenModal'
import { Column } from '../../widgets/generic/Containers'
import { OpsList } from '../../widgets/operations/OpsList'
import { OperationScreenBody } from '../OperationScreen'
import { AccountEditor } from './AccountEditor'
import { AccountStatsBody } from './AccountStats'

export const AccountBody = observer(() => {
    const appState = useAppState()
    const engine = useEngine()
    const currenciesLoader = useCurrenciesLoader()

    const [accId, tabName, opId] = run(() => {
        const params = useParams()
        const accId = nonNull(params.accId, 'accId expected here')
        const opId = params.opId
        if (opId !== undefined) {
            return [accId, 'operations', opId]
        }

        const tabName = params.tabName ?? 'stats'
        return [accId, tabName, null]
    })

    const [acc, setAcc] = useState<Account | null>(null)
    const [stats, setStats] = useState<TotalAndChangeStats | null>(null)
    const navigate = useNavigate()

    const [opModalTitle, setOpModalTitle] = useState('')

    useEffect(() => {
        appState.setOnClose(() => {
            navigate('/accounts')
        })
    }, [])

    useEffect(() => {
        if (!engine.initialised) {
            return
        }

        if (accId === '_total') {
            setAcc({
                id: uuidv7(),
                name: 'Total',
                currency: appState.masterCurrency,
                hidden: false,
                lastModified: DateTime.utc()
            })
            return
        }
        const account = engine.getAccount(accId)
        setAcc(account)
    }, [accId, engine.accounts, appState.masterCurrency])

    useEffect(() => {
        appState.setSubTitle(`Accounts :: ${acc?.name ?? 'Loading...'}`)
    }, [acc?.name])

    useEffect(() => {
        void (async () => {
            const lastOpDate = engine.lastOp?.date ?? appState.timeSpan.endDate
            const allTimeSpan = new CustomTimeSpan(
                engine.firstOp?.date ?? appState.timeSpan.startDate,
                lastOpDate > appState.timeSpan.endDate ? lastOpDate : appState.timeSpan.endDate
            )

            if (accId === '_total') {
                const stats = new AccountsStatsReducer(currenciesLoader, appState.timeSpan, appState.masterCurrency, engine, appState.today)
                await calcStats2(
                    engine,
                    PE.any(),
                    allTimeSpan,
                    appState.today,
                    [stats]
                )
                setStats(stats.total)
                return
            }

            const stats = new AccountStatsReducer(accId, appState.timeSpan)
            await calcStats2(
                engine,
                PE.account(accId),
                allTimeSpan,
                appState.today,
                [stats]
            )
            setStats(stats.stats)
        })()
    }, [accId, appState.timeSpanInfo, appState.today, engine.operations, acc])

    if (
        acc === null
        || stats === null
    ) {
        return <AccountScreenSkeleton />
    }

    const cur = (amount: number, compact = false): string => formatCurrency(amount, acc.currency, compact)

    return (
        <>
            <Column height={'100%'}>
                <Box p={1}>
                    <Typography variant={'h6'} textAlign={'center'} mt={1}>
                        {acc.name}
                    </Typography>
                    <Typography variant={'h6'} textAlign={'center'} color={'primary.main'} mb={1}>
                        {cur(stats.dayTotal[stats.dayTotal.length - 1].value)}
                    </Typography>
                    <Tabs
                        value={tabName}
                        onChange={(_, tab) => { navigate(`/accounts/${encodeURIComponent(accId)}/${tab as string}`) }}
                        variant={'fullWidth'}
                    >
                        <Tab value={'stats'} label={'Stats'} />
                        {
                            accId !== '_total'
                            && <Tab value={'modify'} label={'Modify'} />
                        }
                        <Tab value={'operations'} label={'Operations'} />
                    </Tabs>
                </Box>
                <Box overflow={'auto'} flex={'1 1 auto'}>
                    <Box px={1}>
                        {
                            match(tabName)
                                .with('stats', () => <AccountStatsBody account={acc} stats={stats} />)
                                .with('modify', () => <AccountEditor acc={acc} setAcc={setAcc} />)
                                .with('operations', () => (
                                    <OpsList
                                        onOpClick={(opId) => {
                                            navigate(`/accounts/${accId}/operations/${opId}`)
                                        }}
                                        predicate={
                                            accId === '_total'
                                                ? PE.filter(appState.filter)
                                                : PE.and(PE.filter(appState.filter), PE.account(acc.name))
                                        }
                                    />
                                ))
                                .otherwise(() => { throw Error('Unimplemented tab') })
                    }
                        <Box minHeight={72} />
                    </Box>
                </Box>
            </Column>
            {
                showIfLazy(opId !== null, () => {
                    return (
                        <FullScreenModal
                            width={'850px'}
                            title={opModalTitle}
                            onClose={() => { navigate(`/accounts/${accId}/operations`) }}
                        >
                            <Box p={1}>
                                <OperationScreenBody
                                    urlOpId={opId ?? ''}
                                    setModalTitle={setOpModalTitle}
                                />
                            </Box>
                        </FullScreenModal>
                    )
                })
        }
        </>
    )
})

function AccountScreenSkeleton(): ReactElement {
    return (
        <>
            <Typography variant={'h6'} mt={2}>
                <Skeleton width={75} sx={{ mx: 'auto' }} />
            </Typography>
            <Typography variant={'h6'} textAlign={'center'} color={'primary.main'} mb={1}>
                <Skeleton width={95} sx={{ mx: 'auto' }} />
            </Typography>
            <Tabs value={0} variant={'fullWidth'}>
                <Tab label={<Skeleton width={45} />} />
                <Tab label={<Skeleton width={65} />} />
                <Tab label={<Skeleton width={35} />} />
            </Tabs>
            <Column gap={1} mt={1}>
                <Skeleton variant={'rounded'} height={185} />
                <Skeleton variant={'rounded'} height={200} />
                <Skeleton variant={'rounded'} height={180} />
            </Column>
        </>
    )
}
