import React, { type ReactElement, useState } from 'react'
import { MainAppDrawer } from './MainAppDrawer'
import { AppBar, IconButton, Toolbar } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'

export const MainAppBar = (): ReactElement => {
    const [drawerOpen, setDrawerOpen] = useState(false)

    return <>
        <MainAppDrawer open={drawerOpen} onOpen={() => { setDrawerOpen(true) }} onClose={() => { setDrawerOpen(false) }}/>
        <AppBar position="static">
            <Toolbar>
                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                    onClick={() => { setDrawerOpen(true) }}
                >
                    <FontAwesomeIcon icon={faBars}/>
                </IconButton>
            </Toolbar>
        </AppBar>
    </>
}
