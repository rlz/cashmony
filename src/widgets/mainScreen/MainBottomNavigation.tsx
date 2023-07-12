import { faBullseye, faList, faShapes, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BottomNavigation, BottomNavigationAction, type SxProps } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { match, P } from 'ts-pattern'

import { screenWidthIs } from '../../helpers/useWidth'

type Tabs = 'o' | 'c' | 'g' | 'a' | null

const FIXED_BOTTON_NAVIGATION_STYLE: SxProps = { position: 'fixed', bottom: 0, left: 0, right: 0 }

export function MainBottomNavigation (): ReactElement {
    const loc = useLocation()
    const nav = useNavigate()
    const smallScreen = screenWidthIs('xs', 'sm')

    const active = match<string, Tabs>(loc.pathname)
        .with(P.string.startsWith('/operations'), () => 'o')
        .with(P.string.startsWith('/new-op'), () => 'o')
        .with(P.string.startsWith('/categories'), () => 'c')
        .with(P.string.startsWith('/goals'), () => 'g')
        .with(P.string.startsWith('/accounts'), () => 'a')
        .otherwise(() => null)

    return <BottomNavigation
        showLabels
        value={active}
        sx={smallScreen ? FIXED_BOTTON_NAVIGATION_STYLE : undefined}
    >
        <BottomNavigationAction
            value={'o'}
            label={'Operations'}
            icon={<FontAwesomeIcon size={'lg'} icon={faList} />}
            onClick={() => { nav('/operations') }}
        />
        <BottomNavigationAction
            value={'c'}
            label={'Categories'}
            icon={<FontAwesomeIcon size={'lg'} icon={faShapes} />}
            onClick={() => { nav('/categories') }}
        />
        <BottomNavigationAction
            value={'g'}
            label={'Goals'}
            icon={<FontAwesomeIcon size={'lg'} icon={faBullseye} />}
            onClick={() => { nav('/goals') }}
        />
        <BottomNavigationAction
            value={'a'}
            label={'Accounts'}
            icon={<FontAwesomeIcon size={'lg'} icon={faWallet} />}
            onClick={() => { nav('/accounts') }}
        />
    </BottomNavigation>
}
