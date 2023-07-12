import { Box } from '@mui/material'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useState } from 'react'

import { CurrenciesModel } from '../../../model/currencies'
import { DEFAULT_FILTER } from '../../../model/filter'
import { type ExpensesGoal } from '../../../model/model'
import { FullScreenModal } from '../../FullScreenModal'
import { Column } from '../../generic/Containers'
import { ExpensesGoalEditor } from './ExpensesGoalEditor'

export const AddExpensesGoalModal = observer(({ onClose }: { onClose: () => void }): ReactElement => {
    const currenciesModel = CurrenciesModel.instance()

    const [goal, setGoal] = useState<ExpensesGoal>({
        name: '',
        lastModified: DateTime.utc(),
        filter: DEFAULT_FILTER,
        perDayAmount: 0,
        currency: currenciesModel.currencies[0],
        isRegular: false
    })

    return <>
        <FullScreenModal
            title={'Add expenses goal'}
            width={'600px'}
            onClose={onClose}
        >
            <Column gap={1} p={1} overflow={'auto'}>
                <ExpensesGoalEditor goal={goal} onChange={setGoal} />
            </Column>
            <Box height={'80px'}/>
        </FullScreenModal>
    </>
})
