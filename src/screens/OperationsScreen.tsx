import React, { type ReactElement } from 'react'
import { observer } from 'mobx-react-lite'
import { OpsList } from '../widgets/operations/OpsList'
import { MainScreen } from '../widgets/mainScreen/MainScreen'

export const OperationsScreen = observer((): ReactElement => {
    return <MainScreen>
        <OpsList sx={{ p: 1, maxWidth: 800, width: '100vw', mx: 'auto' }}/>
    </MainScreen>
})
OperationsScreen.displayName = 'OperatiosScreen'
