import React, { useState, type ReactElement } from 'react'
import { observer } from 'mobx-react-lite'
import { Backdrop, Box, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCreditCard, faHandHoldingDollar, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { MainScreen } from '../widgets/MainScreen'
import { Operations } from '../model/stats'
import { AppState } from '../model/appState'
import { OpsList } from '../widgets/operations/OpsList'

const appState = AppState.instance()

const Fab = (): ReactElement => {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    return <>
        <Backdrop open={open} sx={{ backdropFilter: 'grayscale(30%) brightness(300%) blur(2px)' }} />
        <SpeedDial
            sx={{ position: 'fixed', bottom: 70, right: 16 }}
            icon={<SpeedDialIcon />}
            ariaLabel="add"
            open={open}
            onOpen={() => { setOpen(true) }}
            onClose={() => { setOpen(false) }}
        >
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faCreditCard}/>}
                tooltipOpen
                tooltipTitle="Expence"
                FabProps={{ color: 'error', size: 'medium' }}
                onClick={() => { navigate('/new-op/expense') }}
            />
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faHandHoldingDollar} />}
                tooltipOpen
                tooltipTitle="Income"
                FabProps={{ color: 'success', size: 'medium' }}
                onClick={() => { navigate('/new-op/income') }}
            />
            <SpeedDialAction
                icon={<FontAwesomeIcon icon={faMoneyBillTransfer} />}
                tooltipOpen
                tooltipTitle="Transfer"
                FabProps={{ color: 'info', size: 'medium' }}
                onClick={() => { navigate('/new-op/transfer') }}
            />
        </SpeedDial>
    </>
}

export const OperationsScreen = observer((): ReactElement => {
    return <MainScreen>
        <OpsList operations={Operations.all().forTimeSpan(appState.timeSpan)}/>
        <Box minHeight={144}/>
        <Fab />
    </MainScreen>
})
