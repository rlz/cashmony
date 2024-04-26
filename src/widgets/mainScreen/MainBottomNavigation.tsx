import { faBullseye, faChartLine, faList, faShapes, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { match, P } from 'ts-pattern'

import { AccountsModel } from '../../model/accounts'
import { CategoriesModel } from '../../model/categories'

type Tabs = 'o' | 'c' | 'g' | 'a' | 'analitics' | null

interface NavItemProps {
    selected: boolean
    icon: JSX.Element
    disabled?: boolean
    label: string
    onClick: () => void
}

function NavItem(props: NavItemProps): JSX.Element {
    const theme = useTheme()
    const color = props.disabled ?? false
        ? theme.palette.text.disabled
        : (
                props.selected
                    ? 'primary.main'
                    : theme.palette.text.primary
            )

    const el = (
        <Stack color={color} alignItems={'center'} py={1}>
            {props.icon}
            <Typography
                width={'100%'}
                textAlign={'center'}
                variant={'body2'}
                overflow={'hidden'}
                whiteSpace={'nowrap'}
                textOverflow={'ellipsis'}
            >
                {props.label}
            </Typography>
        </Stack>
    )

    return (
        <Box flex={'1 1 0'} minWidth={0}>
            {
                props.disabled ?? false
                    ? el
                    : (
                        <a onClick={props.onClick}>
                            {el}
                        </a>
                        )
            }
        </Box>
    )
}

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
        <Stack direction={'row'} justifyContent={'center'}>
            <Stack direction={'row'} width={'100%'} maxWidth={'500px'} overflow={'hidden'}>
                {
                    accountsModel.accounts?.size === 0 || categoriesModel.categories?.size === 0
                        ? undefined
                        : (
                            <NavItem
                                selected={active === 'o'}
                                label={'Operations'}
                                disabled={accountsModel.accounts?.size === 0}
                                icon={<FontAwesomeIcon size={'lg'} icon={faList} />}
                                onClick={() => { nav('/operations') }}
                            />
                            )
                }
                <NavItem
                    selected={active === 'analitics'}
                    label={'Analitics'}
                    icon={<FontAwesomeIcon size={'lg'} icon={faChartLine} />}
                    onClick={() => { nav('/analitics') }}
                />
                {
                    accountsModel.accounts?.size === 0
                        ? undefined
                        : (
                            <NavItem
                                selected={active === 'c'}
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
                            <NavItem
                                selected={active === 'g'}
                                label={'Goals'}
                                disabled={accountsModel.accounts?.size === 0}
                                icon={<FontAwesomeIcon size={'lg'} icon={faBullseye} />}
                                onClick={() => { nav('/goals') }}
                            />
                            )
                }
                <NavItem
                    selected={active === 'a'}
                    label={'Accounts'}
                    icon={<FontAwesomeIcon size={'lg'} icon={faWallet} />}
                    onClick={() => { nav('/accounts') }}
                />
            </Stack>
        </Stack>
    )
}
