import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { AccountScreen } from './screens/account/AccountScreen'
import { AnaliticsScreen } from './screens/AnaliticsScreen'
import { CategoryScreen } from './screens/category/CategoryScreen'
import { AuthScreen } from './screens/google/AuthScreen'
import { GoogleSyncScreen } from './screens/google/GoogleSyncScreen'
import { LoadingScreen } from './screens/LoadingScreen'
import { OperationScreen } from './screens/OperationScreen'
import { SignupSigninScreen } from './screens/SignupSigninScreen'
import { ExpensesGoalScreen } from './screens/watch/ExpensesGoalScreen'
import { useEngine } from './useEngine'

declare global {
    interface Window { routerNavigate: (to: string) => Promise<void> }
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to={'operations'} />
    },
    {
        path: '/operations',
        element: <OperationScreen />
    },
    {
        path: '/categories',
        element: <CategoryScreen />
    },
    {
        path: '/accounts',
        element: <AccountScreen />
    },
    {
        path: '/goals',
        element: <ExpensesGoalScreen />
    },
    {
        path: '/google-sync',
        element: <GoogleSyncScreen />
    },
    {
        path: '/auth',
        element: <AuthScreen />
    },
    {
        path: 'operations/:opId',
        element: <OperationScreen />
    },
    {
        path: '/new-op/expense',
        element: <OperationScreen />
    },
    {
        path: '/new-op/income',
        element: <OperationScreen />
    },
    {
        path: '/new-op/transfer',
        element: <OperationScreen />
    },
    {
        path: '/categories/:catId',
        element: <CategoryScreen />
    },
    {
        path: '/categories/:catId/:tabName',
        element: <CategoryScreen />
    },
    {
        path: '/categories/:catId/operations/:opId',
        element: <CategoryScreen />
    },
    {
        path: '/accounts/:accId',
        element: <AccountScreen />
    },
    {
        path: '/accounts/:accId/:tabName',
        element: <AccountScreen />
    },
    {
        path: '/accounts/:accId/operations/:opId',
        element: <AccountScreen />
    },
    {
        path: '/goals/:goalId',
        element: <ExpensesGoalScreen />
    },
    {
        path: '/goals/:goalId/:tabName',
        element: <ExpensesGoalScreen />
    },
    {
        path: '/goals/:goalId/operations/:opId',
        element: <ExpensesGoalScreen />
    },
    {
        path: '/analitics',
        Component: AnaliticsScreen
    },
    {
        path: '/analitics/stats',
        Component: AnaliticsScreen
    },
    {
        path: '/analitics/op/:opId',
        Component: AnaliticsScreen
    },
    {
        path: '/signin',
        Component: SignupSigninScreen
    },
    {
        path: '/signup',
        Component: SignupSigninScreen
    }
])

window.routerNavigate = router.navigate.bind(router)

export const App = observer(function App(): ReactElement {
    const engine = useEngine()
    const location = window.location

    if (!engine.initialised) {
        return <LoadingScreen />
    }

    if (
        engine.accounts.length === 0
        && !location.pathname.startsWith('/accounts')
        && !location.pathname.startsWith('/auth')
        && !location.pathname.startsWith('/google-sync')
    ) {
        window.location.assign('/accounts')
        return <></>
    }

    return (
        <RouterProvider router={router} />
    )
})
