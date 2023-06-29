import { faBullseye, faList, faShapes, faWallet } from '@fortawesome/free-solid-svg-icons'
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
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
    >
        <BottomNavigationAction
            value="/operations"
            label="Operations"
            icon={<FontAwesomeIcon size='lg' icon={faList} />}
            onClick={() => { nav('/operations') }}
        />
        <BottomNavigationAction
            value="/categories"
            label="Categories"
            icon={<FontAwesomeIcon size='lg' icon={faShapes} />}
            onClick={() => { nav('/categories') }}
        />
        <BottomNavigationAction
            value="/goals"
            label="Goals"
            icon={<FontAwesomeIcon size="lg" icon={faBullseye} />}
            onClick={() => { nav('/goals') }}
        />
        <BottomNavigationAction
            value="/accounts"
            label="Accounts"
            icon={<FontAwesomeIcon size="lg" icon={faWallet} />}
            onClick={() => { nav('/accounts') }}
        />
    </BottomNavigation>
}
