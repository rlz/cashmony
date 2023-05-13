import React, { type ReactElement } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { OperationsScreen } from './screens/OperationsScreen'
import { AppBar, Box, IconButton, Toolbar, useTheme } from '@mui/material'
import { OperationsModel } from './model/operations'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleChevronLeft } from '@fortawesome/free-solid-svg-icons'
import { OperationScreen } from './screens/OperationScreen'

const App = (): ReactElement => {
    const theme = useTheme()

    const router = createBrowserRouter([
        {
            path: '/',
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
        },
        {
            path: 'operations/:opId',
            element: <Box width="100vw" height="100vh" display="flex" flexDirection="column">
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                            onClick={() => { void router.navigate('/operations') }}
                        >
                            <FontAwesomeIcon icon={faCircleChevronLeft}/>
                        </IconButton>
                    </Toolbar>
                </AppBar>
                <Box
                    display="flex"
                    flexDirection="column"
                    textOverflow="scroll"
                    flex="1 0 0"
                    bgcolor={theme.palette.background.default}
                >
                    <OperationScreen />
                </Box>
            </Box>
        }
    ])

    return (
        <RouterProvider router={router}/>
    )
}

export default App
