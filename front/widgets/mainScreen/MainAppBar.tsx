import { faBars, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AppBar, IconButton, SwipeableDrawer, type SxProps, Toolbar, Typography } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useState } from 'react'

import { showIf } from '../../helpers/smallTools'
import { screenWidthIs } from '../../helpers/useWidth'
import { useFrontState } from '../../model/FrontState'
import { FullScreenModal } from '../FullScreenModal'
import { Column } from '../generic/Containers'
import { DivBody2 } from '../generic/Typography'
import { AppStateSettings } from './AppStateSettings'

interface CashmonyAppBarProps {
    modal?: boolean
    title: string
    subTitle: string | null
    onSettingsClick?: () => void
    onClose?: () => void
}

const CLOSE_BTN_BIG_SCREEN: SxProps = {
    color: 'primary.main',
    position: 'relative',
    left: '8px',
    top: '64px'
}

export function CashmonyAppBar(props: CashmonyAppBarProps): ReactElement {
    const smallScreen = screenWidthIs('xs', 'sm')

    return (
        <AppBar position={'static'}>
            <Toolbar>
                <IconButton
                    size={'large'}
                    edge={'start'}
                    color={'inherit'}
                    disabled={props.onSettingsClick === undefined}
                    sx={{ visibility: props.onSettingsClick === undefined ? 'hidden' : undefined }}
                    onClick={props.onSettingsClick}
                >
                    <FontAwesomeIcon icon={faBars} />
                </IconButton>
                <Column flex={'1 1 0'} textAlign={'center'} gap={0.3}>
                    <Typography variant={'h6'} component={'div'} lineHeight={1}>
                        {props.title}
                    </Typography>
                    {
                    props.subTitle !== undefined
                        ? (
                            <DivBody2 noWrap>
                                {props.subTitle}
                            </DivBody2>
                            )
                        : undefined
                }
                </Column>
                <IconButton
                    size={'large'}
                    edge={'end'}
                    color={'inherit'}
                    disabled={props.onClose === undefined}
                    sx={{
                        ...(smallScreen || props.modal === true
                            ? {}
                            : CLOSE_BTN_BIG_SCREEN),
                        visibility: props.onClose === undefined ? 'hidden' : undefined
                    }}
                    onClick={props.onClose}
                >
                    <FontAwesomeIcon icon={faTimesCircle} />
                </IconButton>
            </Toolbar>
        </AppBar>
    )
}

export const MainAppBar = observer(function MainAppBar(): ReactElement {
    const appState = useFrontState()
    const [showSettings, setShowSettings] = useState(false)
    const smallScreen = screenWidthIs('xs', 'sm')

    return (
        <>
            {
            showIf(
                smallScreen,
                <SwipeableDrawer
                    open={showSettings}
                    anchor={'left'}
                    onOpen={() => { setShowSettings(true) }}
                    onClose={() => { setShowSettings(false) }}
                >
                    <AppStateSettings height={'100%'} width={'90vw'} maxWidth={'20rem'} />
                </SwipeableDrawer>
            )
        }
            {
            showIf(
                !smallScreen && showSettings,
                <FullScreenModal
                    width={'600px'}
                    title={'Settings'}
                    onClose={() => { setShowSettings(false) }}
                >
                    <AppStateSettings />
                </FullScreenModal>
            )
        }
            <CashmonyAppBar
                title={'Cashmony'}
                subTitle={appState.topBarState.subTitle}
                onSettingsClick={() => { setShowSettings(true) }}
                onClose={appState.topBarState.onClose ?? undefined}
            />
        </>
    )
})
