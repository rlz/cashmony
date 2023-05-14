import React, { type ReactElement } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { OperationsScreen } from './screens/OperationsScreen'
import { OperationsModel } from './model/operations'
import { OperationScreen } from './screens/OperationScreen'

const App = (): ReactElement => {
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
            element: <OperationScreen />
        }
    ])

    return (
        <RouterProvider router={router}/>
    )
}

export default App
