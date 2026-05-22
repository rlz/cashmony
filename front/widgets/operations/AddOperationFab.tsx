import { AddCard as AddCardIcon, CreditCard as CreditCardIcon, CurrencyExchange as CurrencyExchangeIcon } from '@mui/icons-material'
import { Backdrop, Portal, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material'
import { JSX, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function AddOperationFab(): JSX.Element {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    return (
        <Portal>
            <Backdrop open={open} sx={{ backdropFilter: 'grayscale(30%) brightness(300%) blur(2px)' }} />
            <SpeedDial
                sx={{ position: 'fixed', bottom: 70, right: 16 }}
                icon={<SpeedDialIcon />}
                ariaLabel={'add'}
                open={open}
                onOpen={() => { setOpen(true) }}
                onClose={() => { setOpen(false) }}
            >
                <SpeedDialAction
                    icon={<CreditCardIcon />}
                    slotProps={{
                        tooltip: {
                            open,
                            title: 'Expence'
                        },
                        fab: { color: 'error', size: 'medium' }
                    }}
                    onClick={() => { void navigate('/new-op/expense') }}
                />
                <SpeedDialAction
                    icon={<AddCardIcon />}
                    slotProps={{
                        tooltip: {
                            open,
                            title: 'Income'
                        },
                        fab: { color: 'success', size: 'medium' }
                    }}
                    onClick={() => { void navigate('/new-op/income') }}
                />
                <SpeedDialAction
                    icon={<CurrencyExchangeIcon />}
                    slotProps={{
                        tooltip: {
                            open,
                            title: 'Transfer'
                        },
                        fab: { color: 'info', size: 'medium' }
                    }}
                    onClick={() => { void navigate('/new-op/transfer') }}
                />
            </SpeedDial>
        </Portal>
    )
}
