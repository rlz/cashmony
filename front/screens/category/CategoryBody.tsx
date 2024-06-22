import { Box, Tab, Tabs, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { Category } from '../../../engine/model'
import { PE } from '../../../engine/predicateExpression'
import { TotalAndChangeStats } from '../../../engine/stats/model'
import { calcStats2 } from '../../../engine/stats/newStatsProcessor'
import { TotalAndChangeReducer } from '../../../engine/stats/TotalAndChangeReducer'
import { formatCurrency } from '../../helpers/currencies'
import { nonNull, run, runAsync, showIfLazy } from '../../helpers/smallTools'
import { useFrontState } from '../../model/FrontState'
import { useCurrenciesLoader } from '../../useCurrenciesLoader'
import { useEngine } from '../../useEngine'
import { ExpensesGroupScreenSkeleton } from '../../widgets/expenses/ExpensesGroupScreenSkeleton'
import { ExpensesStatsWidget } from '../../widgets/expenses/ExpensesStatsWidget'
import { FullScreenModal } from '../../widgets/FullScreenModal'
import { Column } from '../../widgets/generic/Containers'
import { OpsList } from '../../widgets/operations/OpsList'
import { OperationScreenBody } from '../OperationScreen'
import { CategoryEditor } from './CategoryEditor'

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
            navigate('/categories')
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
                await calcStats2(engine, PE.any(), appState.timeSpan, appState.today, [stats])
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
                    <Tabs value={tabName} onChange={(_, tab) => { navigate(`/categories/${catId}/${tab as string}`) }} variant={'fullWidth'}>
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
                                            navigate(`/categories/${catId}/operations/${opId}`)
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
                            onClose={() => { navigate(`/categories/${catId}/operations`) }}
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
CategoryScreenBody.displayName = 'CategoryScreenBody'
