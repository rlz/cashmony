import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { SignupSigninScreen } from 'rlz-engine/dist/client/screens/SignupSigninScreen'

import { AccountScreen } from './screens/account/AccountScreen'
import { AnaliticsScreen } from './screens/AnaliticsScreen'
import { CategoryScreen } from './screens/category/CategoryScreen'
import { LoadingScreen } from './screens/LoadingScreen'
import { OperationScreen } from './screens/OperationScreen'
import { ExpensesGoalScreen } from './screens/watch/ExpensesGoalScreen'
import { AbsoluteNavigateProvider } from './useAbsoluteNavigate'
import { useEngine } from './useEngine'

declare global {
    interface Window { routerNavigate: (to: string) => Promise<void> }
}

const router = createBrowserRouter([
    {
        path: '/',
        Component: () => <Navigate to={'operations'} />
    },
    {
        path: '/operations',
        Component: OperationScreen
    },
    {
        path: '/categories',
        Component: CategoryScreen
    },
    {
        path: '/accounts',
        Component: AccountScreen
    },
    {
        path: '/goals',
        Component: ExpensesGoalScreen
    },
    {
        path: 'operations/:opId',
        Component: OperationScreen
    },
    {
        path: '/new-op/expense',
        Component: OperationScreen
    },
    {
        path: '/new-op/income',
        Component: OperationScreen
    },
    {
        path: '/new-op/transfer',
        Component: OperationScreen
    },
    {
        path: '/categories/:catId',
        Component: CategoryScreen
    },
    {
        path: '/categories/:catId/:tabName',
        Component: CategoryScreen
    },
    {
        path: '/categories/:catId/operations/:opId',
        Component: CategoryScreen
    },
    {
        path: '/accounts/:accId',
        Component: AccountScreen
    },
    {
        path: '/accounts/:accId/:tabName',
        Component: AccountScreen
    },
    {
        path: '/accounts/:accId/operations/:opId',
        Component: AccountScreen
    },
    {
        path: '/goals/:goalId',
        Component: ExpensesGoalScreen
    },
    {
        path: '/goals/:goalId/:tabName',
        Component: ExpensesGoalScreen
    },
    {
        path: '/goals/:goalId/operations/:opId',
        Component: ExpensesGoalScreen
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
        Component: () => {
            return <SignupSigninScreen appName={'Cashmony'} />
        }
    },
    {
        path: '/signup',
        Component: () => {
            return <SignupSigninScreen appName={'Cashmony'} />
        }
    }
])

export const App = observer(function App(): ReactElement {
    const engine = useEngine()
    const location = window.location

    if (!engine.initialised) {
        return <LoadingScreen />
    }

    if (
        engine.accounts.length === 0
        && !location.pathname.startsWith('/accounts')
        && !location.pathname.startsWith('/signin')
        && !location.pathname.startsWith('/signup')
    ) {
        window.location.assign('/accounts')
        return <></>
    }

    return (
        <AbsoluteNavigateProvider value={(to) => { void router.navigate(to) }}>
            <RouterProvider router={router} />
        </AbsoluteNavigateProvider>
    )
})
