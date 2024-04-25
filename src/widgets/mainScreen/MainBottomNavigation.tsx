import { faBullseye, faChartLine, faList, faShapes, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BottomNavigation, BottomNavigationAction } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { match, P } from 'ts-pattern'

import { AccountsModel } from '../../model/accounts'
import { CategoriesModel } from '../../model/categories'

type Tabs = 'o' | 'c' | 'g' | 'a' | 'analitics' | null

export function MainBottomNavigation(): ReactElement {
    const accountsModel = AccountsModel.instance()
    const categoriesModel = CategoriesModel.instance()

    const loc = useLocation()
    const nav = useNavigate()

    const active = match<string, Tabs>(loc.pathname)
        .with(P.string.startsWith('/operations'), () => 'o')
        .with(P.string.startsWith('/new-op'), () => 'o')
        .with(P.string.startsWith('/categories'), () => 'c')
        .with(P.string.startsWith('/goals'), () => 'g')
        .with(P.string.startsWith('/accounts'), () => 'a')
        .with(P.string.startsWith('/analitics'), () => 'analitics')
        .otherwise(() => null)

    return (
        <BottomNavigation
            showLabels
            value={active}
        >
            {
                accountsModel.accounts?.size === 0 || categoriesModel.categories?.size === 0
                    ? undefined
                    : (
                        <BottomNavigationAction
                            value={'o'}
                            label={'Operations'}
                            disabled={accountsModel.accounts?.size === 0}
                            icon={<FontAwesomeIcon size={'lg'} icon={faList} />}
                            onClick={() => { nav('/operations') }}
                        />
                        )
            }
            <BottomNavigationAction
                value={'analitics'}
                label={'Analitics'}
                icon={<FontAwesomeIcon size={'lg'} icon={faChartLine} />}
                onClick={() => { nav('/analitics') }}
            />
            {
                accountsModel.accounts?.size === 0
                    ? undefined
                    : (
                        <BottomNavigationAction
                            value={'c'}
                            label={'Categories'}
                            disabled={accountsModel.accounts?.size === 0}
                            icon={<FontAwesomeIcon size={'lg'} icon={faShapes} />}
                            onClick={() => { nav('/categories') }}
                        />
                        )
            }
            {
                accountsModel.accounts?.size === 0 || categoriesModel.categories?.size === 0
                    ? undefined
                    : (
                        <BottomNavigationAction
                            value={'g'}
                            label={'Goals'}
                            disabled={accountsModel.accounts?.size === 0}
                            icon={<FontAwesomeIcon size={'lg'} icon={faBullseye} />}
                            onClick={() => { nav('/goals') }}
                        />
                        )
            }
            <BottomNavigationAction
                value={'a'}
                label={'Accounts'}
                icon={<FontAwesomeIcon size={'lg'} icon={faWallet} />}
                onClick={() => { nav('/accounts') }}
            />
        </BottomNavigation>
    )
}
