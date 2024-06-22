import { Box } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useMemo, useState } from 'react'
import { uuidv7 } from 'uuidv7'

import { DEFAULT_FILTER, type Watch } from '../../../engine/model'
import { sortCurrencies } from '../../../engine/sortCurrencies'
import { screenWidthIs } from '../../helpers/useWidth'
import { useEngine } from '../../useEngine'
import { FullScreenModal } from '../../widgets/FullScreenModal'
import { Column } from '../../widgets/generic/Containers'
import { ExpensesGoalEditor } from './ExpensesGoalEditor'

export const AddExpensesGoalModal = observer(({ onClose }: { onClose: () => void }): ReactElement => {
    const engine = useEngine()
    const smallScreen = screenWidthIs('xs', 'sm')

    const initialGoal = useMemo(() => {
        const id = engine.watches.find(i => i.deleted === true)?.id ?? uuidv7()

        return {
            id,
            name: '',
            lastModified: DateTime.utc(),
            filter: DEFAULT_FILTER,
            perDayAmount: 0,
            currency: sortCurrencies(engine)[0]
        }
    }, [])

    const [goal, setGoal] = useState<Watch>(initialGoal)

    return (
        <>
            <FullScreenModal
                title={'Add expenses goal'}
                width={'600px'}
                onClose={onClose}
            >
                <Column gap={1} p={1} overflow={'auto'}>
                    <ExpensesGoalEditor
                        goal={goal}
                        onChange={(w) => {
                            setGoal(w)
                            onClose()
                        }}
                    />
                </Column>
                {
                    smallScreen
                    && <Box height={'80px'} />
                }
            </FullScreenModal>
        </>
    )
})
