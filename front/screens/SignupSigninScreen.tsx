import { Box, Button, CircularProgress, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { apiSignin, apiSignup } from '../../api/api'
import { apiSync } from '../model/apiSync'
import { FrontState, useFrontState } from '../model/FrontState'
import { useEngine } from '../useEngine'

export const SignupSigninScreen = observer(function SignupSigninScreen(): JSX.Element {
    const location = useLocation()
    const navigate = useNavigate()
    const tab = location.pathname.substring(1)

    return (
        <Stack p={1} gap={1} maxWidth={'500px'} mx={'auto'} mt={10}>
            <Typography variant={'h3'} textAlign={'center'}>{'Cashmony'}</Typography>
            <Tabs
                value={tab}
                variant={'fullWidth'}
                onChange={(_, tab) => {
                    void navigate(`/${tab}`)
                }}
            >
                <Tab value={'signin'} label={'Signin'} />
                <Tab value={'signup'} label={'Signup'} />
            </Tabs>
            {
                tab === 'signup'
                && <SignupForm />
            }
            {
                tab === 'signin'
                && <SigninForm />
            }
        </Stack>
    )
})

function SignupForm() {
    const frontState = useFrontState()
    const engine = useEngine()
    const [syncInProgress, setSyncInProgress] = useState(false)
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [nameActivated, setNameActivated] = useState(false)
    const [email, setEmail] = useState('')
    const [emailActivated, setEmailActivated] = useState(false)
    const [password, setPassword] = useState('')
    const [passwordActivated, setPasswordActivated] = useState(false)
    const [password2, setPassword2] = useState('')
    const [password2Activated, setPassword2Activated] = useState(false)

    const doSignUp = useCallback(() => {
        setSyncInProgress(true)
        setTimeout(async () => {
            try {
                await signup(name, email, password, password2, frontState)
                await apiSync(frontState, engine)
                void navigate('/accounts')
            } finally {
                setSyncInProgress(false)
            }
        }, 0)
    }, [name, email, password, password2, frontState])

    return (
        <Stack gap={2} mt={2}>
            <TextField
                label={'Name'}
                value={name}
                error={nameActivated && name === ''}
                helperText={nameActivated ? (name === '' ? 'Name sholud not be empty' : 'ok') : 'required'}
                onChange={(e) => {
                    setNameActivated(true)
                    setName(e.target.value)
                }}
                autoFocus
            />
            <TextField
                label={'E-mail'}
                type={'email'}
                value={email}
                error={emailActivated && !isValidEmail(email)}
                helperText={emailActivated ? (isValidEmail(email) ? 'ok' : 'Invalid e-mail address') : 'required'}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailActivated(true)}
            />
            <TextField
                label={'Password'}
                type={'password'}
                value={password}
                error={passwordActivated && password === ''}
                helperText={passwordActivated ? (password === '' ? 'Empty password' : 'ok') : 'required'}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPasswordActivated(true)}
            />
            <TextField
                label={'Confirm password'}
                type={'password'}
                value={password2}
                error={password2Activated && password2 !== password}
                helperText={password2Activated ? (password2 !== password ? 'Do not match' : 'ok') : 'required'}
                onChange={e => setPassword2(e.target.value)}
                onFocus={() => setPassword2Activated(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        doSignUp()
                    }
                }}
            />
            <Box sx={{ m: 1, position: 'relative' }}>
                <Button
                    variant={'contained'}
                    fullWidth
                    disabled={
                        name === ''
                        || !isValidEmail(email)
                        || password === ''
                        || password2 !== password
                        || syncInProgress
                    }
                    onClick={doSignUp}
                >
                    {'Signup'}
                </Button>
                {syncInProgress && (
                    <CircularProgress
                        size={24}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-12px',
                            marginLeft: '-12px'
                        }}
                    />
                )}
            </Box>
        </Stack>
    )
}

async function signup(name: string, email: string, password: string, password2: string, frontState: FrontState) {
    if (
        name === ''
        || !isValidEmail(email)
        || password === ''
        || password2 !== password
    ) {
        return
    }

    const resp = await apiSignup(name, email, password)

    runInAction(() => {
        frontState.auth = resp
    })
}

function SigninForm() {
    const frontState = useFrontState()
    const engine = useEngine()
    const [syncInProgress, setSyncInProgress] = useState(false)
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')

    const doSignIn = useCallback(() => {
        setSyncInProgress(true)
        setTimeout(async () => {
            try {
                await signin(name, password, frontState)
                await apiSync(frontState, engine)
                void navigate('/')
            } finally {
                setSyncInProgress(false)
            }
        }, 0)
    }, [name, password])

    return (
        <Stack gap={2} mt={2}>
            <TextField label={'Name'} value={name} onChange={e => setName(e.target.value)} />
            <TextField
                label={'Password'}
                type={'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        doSignIn()
                    }
                }}
            />
            <Box sx={{ m: 1, position: 'relative' }}>
                <Button
                    variant={'contained'}
                    fullWidth
                    disabled={
                        name === ''
                        || password === ''
                        || syncInProgress
                    }
                    onClick={doSignIn}
                >
                    {'Signin'}
                </Button>
                {syncInProgress && (
                    <CircularProgress
                        size={24}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginTop: '-12px',
                            marginLeft: '-12px'
                        }}
                    />
                )}
            </Box>
        </Stack>
    )
}

async function signin(name: string, password: string, frontState: FrontState) {
    const resp = await apiSignin(name, password)

    runInAction(() => {
        frontState.auth = resp
    })
}

function isValidEmail(s: string): boolean {
    return z.string().email().safeParse(s).success
}
