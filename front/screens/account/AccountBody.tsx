import { Box, Skeleton, Tab, Tabs, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { ReactElement, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'
import { uuidv7 } from 'uuidv7'

import { CustomTimeSpan } from '../../../engine/dates.js'
import { Account } from '../../../engine/model.js'
import { PE } from '../../../engine/predicateExpression.js'
import { AccountsStatsReducer } from '../../../engine/stats/AccountsStatsReducer.js'
import { AccountStatsReducer } from '../../../engine/stats/AccountStatsReducer.js'
import { TotalAndChangeStats } from '../../../engine/stats/model.js'
import { calcStats } from '../../../engine/stats/stats.js'
import { formatCurrency } from '../../helpers/currencies.js'
import { nonNull, run, showIfLazy } from '../../helpers/smallTools.js'
import { useFrontState } from '../../model/FrontState.js'
import { useCurrenciesLoader } from '../../useCurrenciesLoader.js'
import { useEngine } from '../../useEngine.js'
import { FullScreenModal } from '../../widgets/FullScreenModal.js'
import { Column } from '../../widgets/generic/Containers.js'
import { OpsList } from '../../widgets/operations/OpsList.js'
import { OperationScreenBody } from '../OperationScreen.js'
import { AccountEditor } from './AccountEditor.js'
import { AccountStatsBody } from './AccountStats.js'

export const AccountBody = observer(() => {
    const appState = useFrontState()
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
    const [currencies, setCurrencies] = useState<Record<string, number> | null>(null)
    const navigate = useNavigate()

    const [opModalTitle, setOpModalTitle] = useState('')

    useEffect(() => {
        appState.setOnClose(async () => {
            await navigate('/accounts')
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
            const firstOpDate = engine.firstOp?.date ?? appState.timeSpan.startDate
            const lastOpDate = engine.lastOp?.date ?? appState.timeSpan.endDate
            const allTimeSpan = new CustomTimeSpan(
                firstOpDate < appState.timeSpan.startDate ? firstOpDate : appState.timeSpan.startDate,
                lastOpDate > appState.timeSpan.endDate ? lastOpDate : appState.timeSpan.endDate
            )

            if (accId === '_total') {
                const stats = new AccountsStatsReducer(
                    Object.fromEntries(engine.accounts.map(i => [i.id, i.currency])),
                    currenciesLoader,
                    appState.timeSpan,
                    appState.masterCurrency,
                    engine,
                    appState.today
                )
                await calcStats(
                    engine,
                    PE.any(),
                    allTimeSpan,
                    appState.today,
                    [stats]
                )
                setStats(stats.total)

                const curStats: Record<string, number> = {}
                for (const s of Object.values(stats.accounts)) {
                    curStats[s.currency] = (curStats[s.currency] ?? 0) + s.dayTotal[s.dayTotal.length - 1].value
                }
                setCurrencies(curStats)
                return
            }

            if (acc === null) {
                setStats(null)
                setCurrencies(null)
                return
            }

            const stats = new AccountStatsReducer(accId, acc.currency, appState.timeSpan, appState.today)
            await calcStats(
                engine,
                PE.account(accId),
                allTimeSpan,
                appState.today,
                [stats]
            )
            setStats(stats.stats)
            setCurrencies(null)
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
                        onChange={async (_, tab) => { await navigate(`/accounts/${encodeURIComponent(accId)}/${tab as string}`) }}
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
                                .with('stats', () => (
                                    <AccountStatsBody
                                        currencies={currencies}
                                        account={acc}
                                        stats={stats}
                                    />
                                ))
                                .with('modify', () => <AccountEditor acc={acc} setAcc={setAcc} />)
                                .with('operations', () => (
                                    <OpsList
                                        onOpClick={async (opId) => {
                                            await navigate(`/accounts/${accId}/operations/${opId}`)
                                        }}
                                        predicate={
                                            accId === '_total'
                                                ? PE.filter(appState.filter)
                                                : PE.and(PE.filter(appState.filter), PE.account(acc.id))
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
                            onClose={async () => { await navigate(`/accounts/${accId}/operations`) }}
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
