import { Box, Tab, Tabs, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { match } from 'ts-pattern'

import { formatCurrency } from '../../helpers/currencies'
import { nonNull, run, runAsync, showIfLazy } from '../../helpers/smallTools'
import { AppState } from '../../model/appState'
import { CategoriesModel } from '../../model/categories'
import { Category } from '../../model/model'
import { OperationsModel } from '../../model/operations'
import { PE } from '../../model/predicateExpression'
import { calcStats } from '../../model/stats'
import { periodExpensesReducer } from '../../model/statsReducers'
import { CategoryEditor } from '../../widgets/expenses/editors/CategoryEditor'
import { ExpensesGroupScreenSkeleton } from '../../widgets/expenses/ExpensesGroupScreenSkeleton'
import { ExpensesStatsWidget } from '../../widgets/expenses/ExpensesStatsWidget'
import { FullScreenModal } from '../../widgets/FullScreenModal'
import { Column } from '../../widgets/generic/Containers'
import { OpsList } from '../../widgets/operations/OpsList'
import { OperationScreenBody } from '../OperationScreen'

export const CategoryScreenBody = observer(function CategoryScreenBody(): JSX.Element {
    const appState = AppState.instance()
    const operationsModel = OperationsModel.instance()
    const categoriesModel = CategoriesModel.instance()

    const [catName, tabName, opId] = run(() => {
        const params = useParams()
        const catName = nonNull(params.catName, 'catName expected here')
        const opId = params.opId
        if (opId !== undefined) {
            return [catName, 'operations', opId]
        }

        const tabName = params.tabName ?? 'stats'
        return [catName, tabName, null]
    })

    const [cat, setCat] = useState<Category | null>(null)
    const navigate = useNavigate()
    const [opModalTitle, setOpModalTitle] = useState('')
    const [stats, setStats] = useState<{ total: number } | null>(null)

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
            appState.setSubTitle(`Category :: ${catName}`)
        }
    }, [cat, stats])

    useEffect(
        () => {
            const category = categoriesModel.get(catName)
            setCat(category)
        },
        [
            catName,
            categoriesModel.categories,
            appState.masterCurrency
        ]
    )

    useEffect(
        () => {
            runAsync(async () => {
                const stats = await calcStats(PE.cat(catName), appState.timeSpan, appState.today, {
                    total: periodExpensesReducer(null, PE.cat(catName), currency)
                })

                setStats({
                    total: stats.total[0]
                })
            })
        }, [operationsModel.operations, catName, appState.timeSpanInfo]
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
                    <Tabs value={tabName} onChange={(_, tab) => { navigate(`/categories/${catName}/${tab as string}`) }} variant={'fullWidth'}>
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
                                        currency={currency}
                                        predicate={PE.cat(catName)}
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
                                            navigate(`/categories/${catName}/operations/${opId}`)
                                        }}
                                        predicate={PE.cat(catName)}
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
                            onClose={() => { navigate(`/categories/${catName}/operations`) }}
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
