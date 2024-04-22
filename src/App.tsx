import { Box } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useState } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { runAsync, showIf } from './helpers/smallTools'
import { AccountsModel } from './model/accounts'
import { CategoriesModel } from './model/categories'
import { CurrenciesModel } from './model/currencies'
import { GoalsModel } from './model/goals'
import { OperationsModel } from './model/operations'
import { AccountScreen } from './screens/account/screen'
import { AnaliticsScreen } from './screens/AnaliticsScreen'
import { AuthScreen } from './screens/AuthScreen'
import { CategoryScreen } from './screens/CategoryScreen'
import { ExpensesGoalScreen } from './screens/ExpensesGoalScreen'
import { GoogleSyncScreen } from './screens/GoogleSyncScreen'
import { LoadingScreen } from './screens/LoadingScreen'
import { OperationScreen } from './screens/OperationScreen'
import { DivBody2 } from './widgets/generic/Typography'

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
        element: <ExpensesGoalScreen />
    },
    {
        path: '/goals/:goalName/:tabName',
        element: <ExpensesGoalScreen />
    },
    {
        path: '/goals/:goalName/operations/:opId',
        element: <ExpensesGoalScreen />
    },
    {
        path: '/analitics',
        Component: AnaliticsScreen
    }
])

window.routerNavigate = router.navigate.bind(router)

export const App = observer(function App(): ReactElement {
    const [update, setUpdate] = useState(false)

    useEffect(() => {
        setInterval(() => {
            runAsync(async () => {
                const currentVersion = getCurrentVersion()
                const serverVersion = await getServerVersion()

                if (currentVersion !== null && serverVersion !== null && currentVersion !== serverVersion) {
                    setUpdate(true)
                }
            })
        }, 1000 * 60 * 60) // check every hour
    }, [])

    const location = window.location

    const operationsModel = OperationsModel.instance()
    const accountsModel = AccountsModel.instance()
    const categoriesModel = CategoriesModel.instance()
    const currenciesModel = CurrenciesModel.instance()
    const goalsModel = GoalsModel.instance()

    if (
        operationsModel.operations === null
        || accountsModel.accounts === null
        || accountsModel.accountsSorted === null
        || accountsModel.amounts === null
        || categoriesModel.categories === null
        || categoriesModel.categoriesSorted === null
        || currenciesModel.currencies === null
        || goalsModel.goals === null
    ) {
        return <LoadingScreen />
    }

    if (
        accountsModel.accounts.size === 0
        && !location.pathname.startsWith('/accounts')
        && !location.pathname.startsWith('/auth')
        && !location.pathname.startsWith('/google-sync')
    ) {
        window.location.assign('/accounts')
        return <></>
    }

    return (
        <>
            {
            showIf(
                update,
                <Box my={1}>
                    <DivBody2 textAlign={'center'}>
                        {'New version is available'}
                        <br />
                    </DivBody2>
                    <DivBody2 textAlign={'center'} color={'secondary'}>
                        <a onClick={() => { window.location.reload() }}>{'Update'}</a>
                    </DivBody2>
                </Box>
            )
        }
            <RouterProvider router={router} />
        </>
    )
})

function getCurrentVersion(): string | null {
    const scripts = document.getElementsByTagName('script')
    for (let i = 0; i < scripts.length; ++i) {
        const script = scripts[i]
        const src = script.getAttribute('src')
        if (src?.startsWith('/assets/index-') === true) {
            return src.substring(14, 22)
        }
    }

    return null
}

async function getServerVersion(): Promise<string | null> {
    const resp = await fetch('/', { cache: 'no-store' })

    if (!resp.ok) {
        console.warn(`Can not get server version (response: ${resp.status})`)
        return null
    }

    const body = await resp.text()

    const extracts = /<script [^>]*src="\/assets\/index-([a-z0-9]+).js"><\/script>/.exec(body)

    if (extracts === null) {
        console.warn('Can not get server version (no script in body)')
        return null
    }

    return extracts[1]
}
