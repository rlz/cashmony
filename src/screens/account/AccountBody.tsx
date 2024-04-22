import { Box, Skeleton, Tab, Tabs, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { formatCurrency } from '../../helpers/currencies'
import { nonNull, run, showIfLazy } from '../../helpers/smallTools'
import { AccountsModel } from '../../model/accounts'
import { AppState } from '../../model/appState'
import { Account } from '../../model/model'
import { PE } from '../../model/predicateExpression'
import { FullScreenModal } from '../../widgets/FullScreenModal'
import { Column } from '../../widgets/generic/Containers'
import { OpsList } from '../../widgets/operations/OpsList'
import { OperationScreenBody } from '../OperationScreen'
import { AccountEditor } from './AccountEditor'
import { AccountStats } from './AccountStats'

export const AccountBody = observer(() => {
    const appState = AppState.instance()
    const accountsModel = AccountsModel.instance()

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

        const account = accountsModel.get(accName)
        setAcc(account)
    }, [accName, accountsModel.accounts])

    useEffect(() => {
        appState.setSubTitle(`Accounts :: ${acc?.name ?? 'Loading...'}`)
    }, [acc?.name])

    const [perDayAmount, totalAmount] = useMemo(() => {
        if (accountsModel.amounts === null) {
            return [[], []]
        }

        const timeSpan = appState.timeSpan

        const allDates = [...timeSpan.allDates({ includeDayBefore: true })]

        const totalAmount = allDates.map(d => accountsModel.getAmounts(d)[accName] ?? 0)

        const perDayAmount = totalAmount.map((a, i, arr) => i === 0 ? 0 : a - arr[i - 1])

        return [perDayAmount, totalAmount]
    }, [accName, accountsModel.amounts, appState.timeSpanInfo])

    if (
        acc === null
        || accountsModel.accounts === null
        || accountsModel.amounts === null
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
                        {cur(totalAmount[totalAmount.length - 1])}
                    </Typography>
                    <Tabs
                        value={tabName}
                        onChange={(_, tab) => { navigate(`/accounts/${encodeURIComponent(accName)}/${tab as string}`) }}
                        variant={'fullWidth'}
                    >
                        <Tab value={'stats'} label={'Stats'} />
                        <Tab value={'modify'} label={'Modify'} />
                        <Tab value={'operations'} label={'Operations'} />
                    </Tabs>
                </Box>
                <Box overflow={'auto'} flex={'1 1 auto'}>
                    <Box px={1}>
                        {
                            match(tabName)
                                .with('stats', () => <AccountStats account={acc} perDayAmount={perDayAmount} totalAmount={totalAmount} />)
                                .with('modify', () => <AccountEditor acc={acc} setAcc={setAcc} />)
                                .with('operations', () => (
                                    <OpsList
                                        noFab
                                        onOpClick={(opId) => {
                                            navigate(`/accounts/${accName}/operations/${opId}`)
                                        }}
                                        predicate={PE.and(PE.filter(appState.filter), PE.account(acc.name))}
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
