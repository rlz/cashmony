import './CategoryScreen.scss'

import { Box, Button, Stack, Tab, Tabs, TextField, Typography, useTheme } from '@mui/material'
import color from 'color'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { formatCurrency } from '../helpers/currencies'
import { AppState } from '../model/appState'
import { CurrenciesModel } from '../model/currencies'
import { ParseError, parseFilterQuery } from '../model/filterExpressionParser/parser'
import { NotDeletedOperation } from '../model/model'
import { calcStats2, StatsReducer } from '../model/newStatsProcessor'
import { OperationsModel } from '../model/operations'
import { isExpense, isIncome, PE, Predicate } from '../model/predicateExpression'
import { AnaliticsScreenStats } from '../widgets/AnaliticsScreenStats'
import { FullScreenModal } from '../widgets/FullScreenModal'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'
import { OperationScreenBody } from './OperationScreen'

export const AnaliticsScreen = observer(function AnaliticsScreen(): ReactElement {
    const appState = AppState.instance()
    const operationsModel = OperationsModel.instance()

    const theme = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const [filter, setFilter] = useState('')
    const [predicate, setPredicate] = useState<Predicate>(PE.any())
    const [stats, setStats] = useState<{ total: number, count: number } | null>(null)
    const [error, setError] = useState<ParseError | null>(null)

    const tab: 'stats' | 'ops' = location.pathname.startsWith('/analitics/stats')
        ? 'stats'
        : 'ops'

    const opId = location.pathname.startsWith('/analitics/op/')
        ? location.pathname.substring(14)
        : null

    appState.setOnClose(null)
    appState.setSubTitle('Analitics')

    const applyFilter = () => {
        setError(null)
        if (filter === '') {
            setPredicate(PE.any())
            return
        }
        try {
            setPredicate(parseFilterQuery(filter))
        } catch (error) {
            if (error instanceof ParseError) {
                setError(error)
                return
            }
            throw error
        }
    }

    useEffect(() => {
        void (async () => {
            const s = new Stats(appState.masterCurrency)
            await calcStats2(predicate, appState.timeSpan, appState.today, [s])
            setStats({
                count: s.count,
                total: s.total
            })
        })()
    }, [predicate, appState.timeSpan, appState.today, appState.masterCurrency])

    if (operationsModel.operations === null) {
        return <Box>{'Loading...'}</Box>
    }

    return (
        <MainScreen>
            <Stack height={'100%'}>
                <Stack spacing={1} p={1}>
                    <Stack direction={'row'} spacing={1}>
                        <TextField
                            fullWidth
                            size={'small'}
                            variant={'filled'}
                            value={filter}
                            label={'Filter'}
                            error={error !== null}
                            onChange={(e) => { setFilter(e.target.value) }}
                            onKeyDown={(e) => {
                                if (e.code === 'Enter') {
                                    applyFilter()
                                }
                            }}
                        />
                        <Button
                            size={'small'}
                            variant={'contained'}
                            onClick={applyFilter}
                        >
                            {'Apply'}
                        </Button>
                    </Stack>
                    {
                        error !== null
                        && (
                            <Box
                                borderRadius={1}
                                border={'solid 1px'}
                                borderColor={theme.palette.error.main}
                                bgcolor={color(theme.palette.error.main).opaquer(-0.8).hexa()}
                                p={1}
                                overflow={'auto'}
                            >
                                <pre>{error.message}</pre>
                            </Box>
                        )
                    }
                    {
                        stats !== null
                        && <Typography variant={'body2'}>{`Total: ${formatCurrency(stats.total, 'RUB')} Count: ${stats.count}`}</Typography>
                    }
                    <Tabs value={tab} onChange={(_, t) => navigate(t === 'stats' ? '/analitics/stats' : '/analitics')}>
                        <Tab value={'ops'} label={'Operations'} />
                        <Tab value={'stats'} label={'Stats'} />
                    </Tabs>
                </Stack>
                <Box overflow={'auto'} flexGrow={1} p={1}>
                    {
                        tab === 'ops'
                        && (
                            <OpsList
                                predicate={predicate}
                                timeSpan={appState.timeSpan}
                                onOpClick={opId => navigate(`/analitics/op/${opId}`)}
                            />
                        )
                    }
                    {
                        tab === 'stats'
                        && <AnaliticsScreenStats predicate={predicate} />
                    }
                </Box>
            </Stack>
            {
                opId !== null
                && (
                    <FullScreenModal
                        title={'Operation'}
                        onClose={() => navigate('/analitics')}
                    >
                        <Box p={1}>
                            <OperationScreenBody urlOpId={opId} />
                        </Box>
                    </FullScreenModal>
                )
            }
        </MainScreen>
    )
})

const currenciesModel = CurrenciesModel.instance()

class Stats extends StatsReducer {
    count: number = 0
    total: number = 0
    private readonly currency: string

    constructor(currency: string) {
        super()
        this.currency = currency
    }

    async process(op: NotDeletedOperation): Promise<void> {
        this.count += 1
        if (!isExpense(op) && !isIncome(op)) {
            return
        }

        const rate = await currenciesModel.getRate(op.date, op.currency, this.currency)

        this.total += op.amount * rate
    }
}