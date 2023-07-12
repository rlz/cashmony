import './index.scss'

import { createTheme, CssBaseline, ThemeProvider, Typography, useMediaQuery } from '@mui/material'
import { deepOrange, indigo } from '@mui/material/colors'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement } from 'react'
import ReactDOM from 'react-dom/client'
import { match } from 'ts-pattern'

import App from './App'
import { AppState } from './model/appState'
import reportWebVitals from './reportWebVitals'

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
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

const appState = AppState.instance()

const RootNode = observer((): ReactElement => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

    const theme = match([appState.theme, prefersDarkMode])
        .with(['auto', true], () => 'dark')
        .with(['auto', false], () => 'light')
        .otherwise(() => appState.theme)

    document.body.className = 'theme-' + theme

    return <React.StrictMode>
        <ThemeProvider theme={match(theme).with('light', () => lightTheme).otherwise(() => darkTheme)}>
            <CssBaseline />
            <Typography component={'div'}>
                <App />
            </Typography>
        </ThemeProvider>
    </React.StrictMode>
})

root.render(<RootNode/>)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
void reportWebVitals()
