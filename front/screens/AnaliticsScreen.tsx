import { Clear, History } from '@mui/icons-material'
import { Box, Button, FilledInput, FormControl, IconButton, InputAdornment, InputLabel, Paper, Stack, Tab, Tabs, Typography, useTheme } from '@mui/material'
import color from 'color'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ParseError, parseFilterQuery } from '../../engine/filterExpressionParser/parser.js'
import { NotDeletedOperation } from '../../engine/model.js'
import { isExpense, isIncome, PE, Predicate } from '../../engine/predicateExpression.js'
import { calcStats, StatsReducer } from '../../engine/stats/stats.js'
import { useAnaliticsHistoryStore } from '../model/analiticsHistory.js'
import { useFrontState } from '../model/FrontState.js'
import { useEngine } from '../useEngine.js'
import { AnaliticsScreenStats } from '../widgets/AnaliticsScreenStats.js'
import { FullScreenModal } from '../widgets/FullScreenModal.js'
import { MainScreen } from '../widgets/mainScreen/MainScreen.js'
import { OpsList } from '../widgets/operations/OpsList.js'
import { OperationScreenBody } from './OperationScreen.js'

export const AnaliticsScreen = observer(function AnaliticsScreen(): ReactElement {
    const engine = useEngine()
    const appState = useFrontState()
    const analiticsHistory = useAnaliticsHistoryStore(i => i.history)
    const analiticsHistoryAdd = useAnaliticsHistoryStore(i => i.addHistory)

    const theme = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const [filter, setFilter] = useState('')
    const [predicate, setPredicate] = useState<Predicate>(PE.any())
    const [stats, setStats] = useState<Stats | null>(null)
    const [error, setError] = useState<ParseError | null>(null)
    const [showHistory, setShowHistory] = useState(false)

    const tab: 'stats' | 'ops' = location.pathname.startsWith('/analitics/stats')
        ? 'stats'
        : 'ops'

    const opId = location.pathname.startsWith('/analitics/op/')
        ? location.pathname.substring(14)
        : null

    appState.setOnClose(null)
    appState.setSubTitle('Analitics')

    const applyFilter = (query: string) => {
        setError(null)
        if (query === '') {
            setPredicate(PE.any())
            return
        }
        try {
            setPredicate(parseFilterQuery(query))
            analiticsHistoryAdd(query)
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
            await calcStats(engine, predicate, appState.timeSpan, appState.today, [s])
            setStats(s)
        })()
    }, [predicate, appState.timeSpan, appState.today, appState.masterCurrency])

    const onOpClick = useCallback((opId: string) => navigate(`/analitics/op/${opId}`), [])

    return (
        <MainScreen>
            {
                showHistory && (
                    <FullScreenModal
                        title={'History'}
                        onClose={() => setShowHistory(false)}
                    >
                        <Stack p={1} gap={1} overflow={'auto'}>
                            {
                                analiticsHistory.map((query, i) => (
                                    <Paper
                                        key={i}
                                        variant={'outlined'}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            setFilter(query)
                                            applyFilter(query)
                                            setShowHistory(false)
                                        }}
                                    >
                                        <Box p={1}>
                                            {query}
                                        </Box>
                                    </Paper>
                                ))
                            }
                        </Stack>
                    </FullScreenModal>
                )
            }
            <Stack height={'100%'}>
                <Stack spacing={1} p={1}>
                    <Stack direction={'row'} spacing={1} alignItems={'center'}>
                        <div>
                            <IconButton
                                onClick={() => { setShowHistory(true) }}
                            >
                                <History />
                            </IconButton>
                        </div>
                        <FormControl variant={'filled'} size={'small'} fullWidth>
                            <InputLabel htmlFor={'filter-input'}>{'Filter'}</InputLabel>
                            <FilledInput
                                id={'filter-input'}
                                fullWidth
                                size={'small'}
                                value={filter}
                                error={error !== null}
                                onChange={(e) => { setFilter(e.target.value) }}
                                onKeyDown={(e) => {
                                    if (e.code === 'Enter') {
                                        applyFilter(filter)
                                    }
                                }}
                                endAdornment={(
                                    <InputAdornment position={'end'}>
                                        <IconButton
                                            size={'small'}
                                            edge={'end'}
                                            onClick={() => {
                                                setFilter('')
                                                applyFilter('')
                                            }}
                                        >
                                            <Clear />
                                        </IconButton>
                                    </InputAdornment>
                                )}
                            />
                        </FormControl>
                        <Button
                            size={'small'}
                            variant={'contained'}
                            onClick={() => applyFilter(filter)}
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
                        <Box>
                            <Typography component={'span'} variant={'body2'}>{`${stats?.all ?? 0} ops: `}</Typography>
                            <Typography component={'span'} variant={'body2'}>{`${stats?.expense ?? 0} expense (${stats?.return} return), `}</Typography>
                            <Typography component={'span'} variant={'body2'}>{`${stats?.income ?? 0} income, `}</Typography>
                            <Typography component={'span'} variant={'body2'}>{`${stats?.transfer ?? 0} transfer, `}</Typography>
                            <Typography component={'span'} variant={'body2'}>{`${stats?.adjustment ?? 0} adjustment`}</Typography>
                        </Box>
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
                                onOpClick={onOpClick}
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

class Stats extends StatsReducer {
    all = 0
    expense = 0
    return = 0
    income = 0
    transfer = 0
    adjustment = 0

    private readonly currency: string

    constructor(currency: string) {
        super()
        this.currency = currency
    }

    async process(op: NotDeletedOperation): Promise<void> {
        this.all++
        if (isExpense(op)) {
            this.expense++
            if (op.type === 'income') {
                this.return++
            }
        } else if (isIncome(op)) {
            this.income++
        } else if (op.type === 'transfer') {
            this.transfer++
        } else if (op.type === 'adjustment') {
            this.adjustment++
        }
    }

    async done(): Promise<void> {
        if (this.all !== this.expense + this.income + this.transfer + this.adjustment) {
            throw Error('Wrong assertion at ops count calculations (sum)')
        }
        if (this.return > this.expense) {
            throw Error('Wrong assertion at ops count calculations (return)')
        }
    }
}
