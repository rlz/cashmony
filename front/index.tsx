import './index.scss'

import { createTheme, CssBaseline, ThemeProvider, Typography, useMediaQuery } from '@mui/material'
import { deepOrange, indigo } from '@mui/material/colors'
import { installIntoGlobal } from 'iterator-helpers-polyfill'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
// import { initFrontConfig } from 'rlz-engine/dist/client/config'
import { useAuthState } from 'rlz-engine/dist/client/state/auth'
import { match } from 'ts-pattern'

import { CurrenciesLoader } from '../currencies/currencies'
import { Engine } from '../engine/engine'
import { CashmonyLocalStorage } from '../localstorage/CashmonyLocalStorage'
import { App } from './App'
import { nonNull } from './helpers/smallTools'
import { apiSync } from './model/apiSync'
import { FrontState, FrontStateProvider } from './model/FrontState'
import { CurrenciesLoaderProvider } from './useCurrenciesLoader'
import { EngineProvider } from './useEngine'

installIntoGlobal()

// initFrontConfig({
//     apiDomain: 'https://app.cashmony.ru/'
// })

const root = ReactDOM.createRoot(
    nonNull(document.getElementById('root'), 'Root element not found')
)

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: indigo[400]
        },
        secondary: {
            main: deepOrange[400]
        }
    }
})

const lightTheme = createTheme({
    palette: {
        primary: {
            main: indigo[400]
        },
        secondary: {
            main: deepOrange[400]
        }
    }
})

const RootNode = observer((): ReactElement => {
    const engine = useMemo(() => new Engine(), [])
    const frontState = useMemo(() => new FrontState(engine), [])
    const currenciesLoader = new CurrenciesLoader()

    useEffect(() => {
        const reSync = async () => {
            const authState = useAuthState.getState()
            const authParam = authState.getAuthParam()

            if (authParam === null) {
                return
            }

            await apiSync(authState, frontState, engine)
        }

        engine.subscribe({
            onAccountChange: reSync,
            onCategoryChange: reSync,
            onWatchChange: reSync,
            onOperationChange: reSync,
            onOperationsChange: reSync
        })

        void (async () => {
            const ls = new CashmonyLocalStorage(engine)
            await ls.loadData()

            await reSync()
            const i = setInterval(reSync, 5 * 60000)
            return () => clearInterval(i)
        })()
    }, [])

    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

    const theme = match([frontState.theme, prefersDarkMode])
        .with(['auto', true], () => 'dark')
        .with(['auto', false], () => 'light')
        .otherwise(() => frontState.theme)

    document.body.className = 'theme-' + theme

    return (
        <React.StrictMode>
            <EngineProvider value={engine}>
                <FrontStateProvider value={frontState}>
                    <CurrenciesLoaderProvider value={currenciesLoader}>
                        <ThemeProvider theme={match(theme).with('light', () => lightTheme).otherwise(() => darkTheme)}>
                            <CssBaseline />
                            <Typography component={'div'}>
                                <App />
                            </Typography>
                        </ThemeProvider>
                    </CurrenciesLoaderProvider>
                </FrontStateProvider>
            </EngineProvider>
        </React.StrictMode>
    )
})

root.render(<RootNode />)
