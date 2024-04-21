import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import { AppState } from '../model/appState'
import { calcStats2 } from '../model/newStatsProcessor'
import { Predicate } from '../model/predicateExpression'
import { YMComparisonReducer } from '../model/stats/YMComparisonReducer'
import { YMComparisonPlot } from './plots/YMComparisonPlot'

interface Props {
    predicate: Predicate
}

export const AnaliticsScreenStats = observer(function AnaliticsScreenStats({ predicate }: Props): JSX.Element {
    const appState = AppState.instance()
    const [monthComparison, setMonthComparison] = useState<YMComparisonReducer | null>(null)

    useEffect(() => {
        void (
            async () => {
                const mc = new YMComparisonReducer(appState.masterCurrency)
                await calcStats2(predicate, appState.timeSpan, appState.today, [mc])
                setMonthComparison(mc)
            }
        )()
    }, [predicate, appState.timeSpan, appState.today, appState.masterCurrency])

    return (
        <>
            {
                monthComparison !== null
                && <YMComparisonPlot reducer={monthComparison} currency={appState.masterCurrency} />
            }
        </>
    )
})
