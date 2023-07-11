import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect } from 'react'

import { AppState } from '../model/appState'
import { MainScreen } from '../widgets/mainScreen/MainScreen'
import { OpsList } from '../widgets/operations/OpsList'

export const OperationsScreen = observer(function OperationsScreen (): ReactElement {
    const appState = AppState.instance()

    useEffect(() => {
        appState.setSubTitle('Operations')
        appState.setOnClose(null)
    })

    return <MainScreen>
        <OpsList sx={{ p: 1, maxWidth: 900, width: '100vw', mx: 'auto' }}/>
    </MainScreen>
})
