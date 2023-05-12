import './App.scss'
import React, { type ReactElement, useState } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation, useNavigate } from 'react-router-dom'
import { OperationsScreen } from './screens/Operations'
import { Google } from './google/google'
import { AppBar, BottomNavigation, BottomNavigationAction, Box, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, SwipeableDrawer, TextField, Toolbar } from '@mui/material'
import { loadTransactions } from './google/loadTransactions'
import { OperationsModel, fromOldGoogle } from './model/operations'
import { FIN_DATA_DB } from './model/finDataDb'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faCloudArrowUp, faMoneyBillTransfer, faMoneyBillTrendUp, faWallet } from '@fortawesome/free-solid-svg-icons'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { runInAction } from 'mobx'

const google = Google.instance()

const App = (): ReactElement => {
    const [drawerOpen, setDrawerOpen] = useState(false)

    const router = createBrowserRouter([
        {
            path: '/',
            element: <>
                <Drawer open={drawerOpen} onOpen={() => { setDrawerOpen(true) }} onClose={() => { setDrawerOpen(false) }}/>
                <Box id='App'>
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
                    <Box id='MainArea' display="flex" flexDirection="column">
                        <Outlet />
                    </Box>
                    <Navigation />
                </Box>
            </>,
            children: [
                {
                    index: true,
                    element: <Navigate to="transactions"/>
                },
                {
                    path: 'operations',
                    element: <OperationsScreen operationsModel={OperationsModel.instance()}/>
                },
                {
                    path: 'categories',
                    element: <>Not implemented!</>
                },
                {
                    path: 'accounts',
                    element: <>Not implemented!</>
                }
            ]
        },
        {
            path: '/auth',
            element: <>Authenticated. This window should be closed soon.</>
        }
    ])

    return (
        <RouterProvider router={router}/>
    )
}

export default App

interface Props {
    open: boolean
    onOpen: () => void
    onClose: () => void
}

const Drawer = observer((props: Props): ReactElement => {
    return <SwipeableDrawer
        open={props.open}
        anchor='left'
        onOpen={props.onOpen}
        onClose={props.onClose}
    >
        <List sx={{ width: '100vw', maxWidth: '20rem' }}>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { void loadDataFromGoogle() }}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faCloudArrowUp} />
                    </ListItemIcon>
                    <ListItemText primary="Sync" />
                </ListItemButton>
            </ListItem>
        </List>
        <TextField
            type='date'
            label="Date"
            sx={{ m: 1 }}
            value={OperationsModel.instance().startDate.toFormat('yyyy-LL-dd')}
            onChange={(v) => {
                runInAction(() => {
                    const om = OperationsModel.instance()
                    if (v.target.value === '') {
                        const now = DateTime.now()
                        om.startDate = DateTime.utc(now.year, now.month, now.day)
                    } else {
                        om.startDate = DateTime.fromFormat(v.target.value, 'yyyy-LL-dd', { zone: 'utc' })
                    }
                })
            }}
        />
    </SwipeableDrawer>
})

async function loadDataFromGoogle (): Promise<void> {
    await google.authenticate()
    await google.searchOrCreateDataSpreadsheet()
    await loadTransactions(google)
    const operations = fromOldGoogle(google.transactions)
    await FIN_DATA_DB.putOperations(operations)
}

function Navigation (): ReactElement {
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
