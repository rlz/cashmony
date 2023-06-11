import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { ThemeProvider, Typography, createTheme } from '@mui/material'
import { deepOrange, indigo } from '@mui/material/colors'

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
        },
        background: {
            // default: blueGrey[200],
            // paper: blueGrey[900]
        }
    }
})

root.render(
    <React.StrictMode>
        <ThemeProvider theme={darkTheme}>
            <Typography component="div">
                <App />
            </Typography>
        </ThemeProvider>
    </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
void reportWebVitals()
