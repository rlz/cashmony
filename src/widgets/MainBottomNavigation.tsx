import { faMoneyBillTransfer, faMoneyBillTrendUp, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function MainBottomNavigation (): ReactElement {
    const loc = useLocation()
    const nav = useNavigate()
    return <BottomNavigation
        showLabels
        value={loc.pathname}
    >
        <BottomNavigationAction
            value="/operations"
            label="Operations"
            icon={<FontAwesomeIcon size="2x" icon={faMoneyBillTransfer} />}
            onClick={() => { nav('/operations') }}
        />
        <BottomNavigationAction
            value="/categories"
            label="Categories"
            icon={<FontAwesomeIcon size='2x' icon={faMoneyBillTrendUp} />}
            onClick={() => { nav('/categories') }}
        />
        <BottomNavigationAction
            value="/accounts"
            label="Accounts"
            icon={<FontAwesomeIcon size="2x" icon={faWallet} />}
            onClick={() => { nav('/accounts') }}
        />
    </BottomNavigation>
}
