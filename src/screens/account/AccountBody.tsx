import { Box, Skeleton, Tab, Tabs, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { ReactElement, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { formatCurrency } from '../../helpers/currencies'
import { CustomTimeSpan } from '../../helpers/dates'
import { nonNull, run, showIfLazy } from '../../helpers/smallTools'
import { AccountsModel } from '../../model/accounts'
import { AppState } from '../../model/appState'
import { Account } from '../../model/model'
import { calcStats2 } from '../../model/newStatsProcessor'
import { OperationsModel } from '../../model/operations'
import { PE } from '../../model/predicateExpression'
import { AccountsStatsReducer } from '../../model/stats/AccountsStatsReducer'
import { AccountStatsReducer } from '../../model/stats/AccountStatsReducer'
import { TotalAndChangeStats } from '../../model/stats/data'
import { FullScreenModal } from '../../widgets/FullScreenModal'
import { Column } from '../../widgets/generic/Containers'
import { OpsList } from '../../widgets/operations/OpsList'
import { OperationScreenBody } from '../OperationScreen'
import { AccountEditor } from './AccountEditor'
import { AccountStatsBody } from './AccountStats'

export const AccountBody = observer(() => {
    const appState = AppState.instance()
    const accountsModel = AccountsModel.instance()
    const operationsModel = OperationsModel.instance()

    const [accName, tabName, opId] = run(() => {
        const params = useParams()
        const accName = nonNull(params.accName, 'accName expected here')
        const opId = params.opId
        if (opId !== undefined) {
            return [accName, 'operations', opId]
        }

        const tabName = params.tabName ?? 'stats'
        return [accName, tabName, null]
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
        if (accountsModel.accounts === null) {
            return
        }
        if (accName === '_total') {
            setAcc({
                name: 'Total',
                currency: appState.masterCurrency,
                hidden: false,
                lastModified: DateTime.utc()
            })
            return
        }
        const account = accountsModel.get(accName)
        setAcc(account)
    }, [accName, accountsModel.accounts, appState.masterCurrency])

    useEffect(() => {
        appState.setSubTitle(`Accounts :: ${acc?.name ?? 'Loading...'}`)
    }, [acc?.name])

    useEffect(() => {
        void (async () => {
            const lastOpDate = operationsModel.lastOp?.date ?? appState.timeSpan.endDate
            const allTimeSpan = new CustomTimeSpan(
                operationsModel.firstOp?.date ?? appState.timeSpan.startDate,
                lastOpDate > appState.timeSpan.endDate ? lastOpDate : appState.timeSpan.endDate
            )

            if (accName === '_total') {
                const stats = new AccountsStatsReducer(appState.timeSpan, appState.masterCurrency)
                await calcStats2(
                    PE.any(),
                    allTimeSpan,
                    appState.today,
                    [stats]
                )
                setStats(stats.total)
                return
            }

            const stats = new AccountStatsReducer(accName, appState.timeSpan)
            await calcStats2(
                PE.account(accName),
                allTimeSpan,
                appState.today,
                [stats]
            )
            setStats(stats.stats)
        })()
    }, [accName, appState.timeSpanInfo, appState.today, operationsModel.operations, acc])

    if (
        acc === null
        || accountsModel.accounts === null
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
                        onChange={(_, tab) => { navigate(`/accounts/${encodeURIComponent(accName)}/${tab as string}`) }}
                        variant={'fullWidth'}
                    >
                        <Tab value={'stats'} label={'Stats'} />
                        {
                            accName !== '_total'
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
                                            navigate(`/accounts/${accName}/operations/${opId}`)
                                        }}
                                        predicate={
                                            accName === '_total'
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
                            onClose={() => { navigate(`/accounts/${accName}/operations`) }}
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
