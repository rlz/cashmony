import { AccountBalanceWallet as AccountBalanceWalletIcon, Category as CategoryIcon, List as ListIcon, QueryStats as QueryStatsIcon, Troubleshoot as TroubleshootIcon } from '@mui/icons-material'
import { Box, Stack, SxProps, Theme, Typography, useTheme } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { JSX, type ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { match, P } from 'ts-pattern'

import { useEngine } from '../../useEngine'

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
        <Stack color={color} alignItems={'center'} py={1} spacing={0.4}>
            {props.icon}
            <Typography
                width={'100%'}
                textAlign={'center'}
                variant={'body2'}
                overflow={'hidden'}
                whiteSpace={'nowrap'}
                textOverflow={'ellipsis'}
                fontSize={'0.7rem'}
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

const BOTTOMNAV_SX: SxProps<Theme> = theme => ({
    boxShadow: theme.shadows[3],
    zIndex: 100
})

export const MainBottomNavigation = observer(function MainBottomNavigation(): ReactElement {
    const engine = useEngine()

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
        <Stack direction={'row'} justifyContent={'center'} sx={BOTTOMNAV_SX}>
            <Stack direction={'row'} width={'100%'} maxWidth={'500px'} overflow={'hidden'}>
                {
                    engine.accounts.length === 0 || engine.categories.length === 0
                        ? undefined
                        : (
                                <NavItem
                                    selected={active === 'o'}
                                    label={'Operations'}
                                    disabled={engine.accounts.length === 0}
                                    icon={<ListIcon />}
                                    onClick={() => { void nav('/operations') }}
                                />
                            )
                }
                {
                    engine.operations.length !== 0
                    && (
                        <NavItem
                            selected={active === 'analitics'}
                            label={'Analitics'}
                            icon={<QueryStatsIcon />}
                            onClick={() => { void nav('/analitics') }}
                        />
                    )
                }
                {
                    engine.accounts.length === 0
                        ? undefined
                        : (
                                <NavItem
                                    selected={active === 'c'}
                                    label={'Categories'}
                                    disabled={engine.accounts.length === 0}
                                    icon={<CategoryIcon />}
                                    onClick={() => { void nav('/categories') }}
                                />
                            )
                }
                {
                    engine.accounts.length === 0 || engine.categories.length === 0
                        ? undefined
                        : (
                                <NavItem
                                    selected={active === 'g'}
                                    label={'Goals'}
                                    disabled={engine.accounts.length === 0}
                                    icon={<TroubleshootIcon />}
                                    onClick={() => { void nav('/goals') }}
                                />
                            )
                }
                <NavItem
                    selected={active === 'a'}
                    label={'Accounts'}
                    icon={<AccountBalanceWalletIcon />}
                    onClick={() => { void nav('/accounts') }}
                />
            </Stack>
        </Stack>
    )
})
