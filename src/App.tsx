import React, { type ReactElement } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { OperationsScreen } from './screens/OperationsScreen'
import { OperationsModel } from './model/operations'
import { OperationScreen } from './screens/OperationScreen'
import { PostAuthScreen } from './screens/PostAuthScreen'
import { AuthScreen } from './screens/AuthScreen'

declare global {
    interface Window { routerNavigate: (to: string) => Promise<void> }
}

const router = createBrowserRouter([
    {
        path: '/',
        children: [
            {
                index: true,
                element: <Navigate to="operations"/>
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
        path: '/post-auth',
        element: <PostAuthScreen />
    },
    {
        path: '/auth',
        element: <AuthScreen />
    },
    {
        path: 'operations/:opId',
        element: <OperationScreen />
    }
])

window.routerNavigate = router.navigate

const App = (): ReactElement => {
    return (
        <RouterProvider router={router}/>
    )
}

export default App
