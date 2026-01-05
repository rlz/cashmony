import { Box, Tab, Tabs, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { JSX, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { Category } from '../../../engine/model.js'
import { PE } from '../../../engine/predicateExpression.js'
import { TotalAndChangeStats } from '../../../engine/stats/model.js'
import { calcStats } from '../../../engine/stats/stats.js'
import { TotalAndChangeReducer } from '../../../engine/stats/TotalAndChangeReducer.js'
import { formatCurrency } from '../../helpers/currencies.js'
import { nonNull, run, runAsync, showIfLazy } from '../../helpers/smallTools.js'
import { useFrontState } from '../../model/FrontState.js'
import { useCurrenciesLoader } from '../../useCurrenciesLoader.js'
import { useEngine } from '../../useEngine.js'
import { ExpensesGroupScreenSkeleton } from '../../widgets/expenses/ExpensesGroupScreenSkeleton.js'
import { ExpensesStatsWidget } from '../../widgets/expenses/ExpensesStatsWidget.js'
import { FullScreenModal } from '../../widgets/FullScreenModal.js'
import { Column } from '../../widgets/generic/Containers.js'
import { OpsList } from '../../widgets/operations/OpsList.js'
import { OperationViewEditor } from '../operation/OperationViewEditor.js'
import { CategoryEditor } from './CategoryEditor.js'

export const CategoryScreenBody = observer(function CategoryScreenBody(): JSX.Element {
    const engine = useEngine()
    const appState = useFrontState()
    const currenciesLoader = useCurrenciesLoader()

    const [catId, tabName, opId] = run(() => {
        const params = useParams()
        const catId = nonNull(params.catId, 'catName expected here')
        const opId = params.opId
        if (opId !== undefined) {
            return [catId, 'operations', opId]
        }

        const tabName = params.tabName ?? 'stats'
        return [catId, tabName, null]
    })

    const [cat, setCat] = useState<Category | null>(null)
    const navigate = useNavigate()
    const [opModalTitle, setOpModalTitle] = useState('')
    const [stats, setStats] = useState<TotalAndChangeStats | null>(null)

    const currency = cat?.currency ?? appState.masterCurrency

    useEffect(() => {
        appState.setOnClose(() => {
            void navigate('/categories')
        })
    }, [])

    useEffect(() => {
        if (
            cat === null
            || stats === null
        ) {
            appState.setSubTitle('Category :: loading...')
        } else {
            appState.setSubTitle(`Category :: ${cat.name}`)
        }
    }, [cat, stats])

    useEffect(
        () => {
            const category = engine.getCategory(catId)
            setCat(category)
        },
        [
            catId,
            engine.categories,
            appState.masterCurrency
        ]
    )

    useEffect(
        () => {
            runAsync(async () => {
                const stats = new TotalAndChangeReducer(engine, currenciesLoader, appState.today, appState.timeSpan, PE.cat(catId), currency)
                await calcStats(engine, PE.any(), appState.timeSpan, appState.today, [stats])
                setStats(stats.stats)
            })
        }, [engine.operations, catId, appState.timeSpanInfo, appState.today]
    )

    if (
        cat === null
        || stats === null
    ) {
        return <ExpensesGroupScreenSkeleton />
    }

    const cur = (amount: number, compact = false): string => formatCurrency(amount, currency, compact)

    return (
        <>
            <Column height={'100%'}>
                <Box p={1}>
                    <Typography variant={'h6'} textAlign={'center'} mt={1}>
                        {
                            match(cat.name.trim())
                                .with('', () => '-')
                                .otherwise(v => v)
                        }
                    </Typography>
                    <Typography variant={'h6'} textAlign={'center'} color={'primary.main'} mb={1}>
                        {cur(-stats.total)}
                    </Typography>
                    <Typography variant={'body2'} textAlign={'center'}>
                        {'Goal (30d): '}
                        {cat.perDayAmount !== undefined ? cur(30 * cat.perDayAmount) : '-'}
                    </Typography>
                    <Tabs value={tabName} onChange={(_, tab) => { void navigate(`/categories/${catId}/${tab as string}`) }} variant={'fullWidth'}>
                        <Tab value={'stats'} label={'Stats'} />
                        <Tab value={'modify'} label={'Modify'} />
                        <Tab value={'operations'} label={'Operations'} />
                    </Tabs>
                </Box>
                <Box overflow={'auto'} flex={'1 1 auto'}>
                    <Box px={1}>
                        {
                            match(tabName)
                                .with('stats', () => (
                                    <ExpensesStatsWidget
                                        stats={stats}
                                        predicate={PE.cat(catId)}
                                        perDayGoal={cat.perDayAmount ?? null}
                                    />
                                ))
                                .with('modify', () => (
                                    <CategoryEditor
                                        cat={cat}
                                        setCat={setCat}
                                    />
                                ))
                                .with('operations', () => (
                                    <OpsList
                                        onOpClick={(opId) => {
                                            void navigate(`/categories/${catId}/operations/${opId}`)
                                        }}
                                        predicate={PE.cat(catId)}
                                    />
                                ))
                                .otherwise(() => { throw Error('Unimplenented tab') })
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
                            onClose={() => { void navigate(`/categories/${catId}/operations`) }}
                        >
                            <Box p={1}>
                                <OperationViewEditor
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
CategoryScreenBody.displayName = 'CategoryScreenBody'
