import React, { type ReactElement } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { AccountScreen } from './screens/AccountScreen'
import { AccountsScreen } from './screens/AccountsScreen'
import { AuthScreen } from './screens/AuthScreen'
import { CategoriesScreen } from './screens/CategoriesScreen'
import { CategoryScreen } from './screens/CategoryScreen'
import { ExpensesGoalScreen } from './screens/ExpensesGoalScreen'
import { ExpensesGoalsScreen } from './screens/ExpensesGoalsScreen'
import { GoogleSyncScreen } from './screens/GoogleSyncScreen'
import { OperationScreen } from './screens/OperationScreen'
import { OperationsScreen } from './screens/OperationsScreen'

declare global {
    interface Window { routerNavigate: (to: string) => Promise<void> }
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to={'operations'}/>
    },
    {
        path: '/operations',
        element: <OperationsScreen />
    },
    {
        path: '/categories',
        element: <CategoriesScreen />
    },
    {
        path: '/accounts',
        element: <AccountsScreen />
    },
    {
        path: '/goals',
        element: <ExpensesGoalsScreen />
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
        path: '/categories/:catName',
        element: <CategoryScreen />
    },
    {
        path: '/categories/:catName/:tabName',
        element: <CategoryScreen />
    },
    {
        path: '/categories/:catName/operations/:opId',
        element: <CategoryScreen />
    },
    {
        path: '/accounts/:accName',
        element: <AccountScreen />
    },
    {
        path: '/accounts/:accName/:tabName',
        element: <AccountScreen />
    },
    {
        path: '/accounts/:accName/operations/:opId',
        element: <AccountScreen />
    },
    {
        path: '/goals/:goalName',
        element: <ExpensesGoalScreen/>
    },
    {
        path: '/goals/:goalName/:tabName',
        element: <ExpensesGoalScreen />
    },
    {
        path: '/goals/:goalName/operations/:opId',
        element: <ExpensesGoalScreen />
    }
])

window.routerNavigate = router.navigate

const App = (): ReactElement => {
    return (
        <RouterProvider router={router}/>
    )
}

export default App
