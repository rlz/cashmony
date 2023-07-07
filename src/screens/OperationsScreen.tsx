import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'

import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'

export const OperationsScreen = observer((): ReactElement => {
    return <MainScreen>
        <OpsList sx={{ p: 1, maxWidth: 900, width: '100vw', mx: 'auto' }}/>
    </MainScreen>
})
OperationsScreen.displayName = 'OperatiosScreen'
