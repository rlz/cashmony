import React, { useEffect, type ReactElement, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import makeUrl from '../google/makeUrl'
import { Typography } from '@mui/material'

export function AuthScreen (): ReactElement {
    const urlHash = useLocation().hash.slice(1)

    const params: Record<string, string> = {}

    urlHash.split('&').forEach(i => {
        const [param, value] = i.split('=')
        params[param] = decodeURIComponent(value)
    })

    const redirect = useMemo(() => {
        return window.opener.location.pathname as string
    }, [])

    useEffect(() => {
        if ('access_token' in params && 'expires_in' in params && 'scope' in params && 'token_type' in params) {
            window.opener.routerNavigate(
                makeUrl('/google-sync', {
                    auth: params.access_token,
                    redirect
                })
            )
            window.close()
            return
        }

        throw Error(`Can not parse auth URL: ${urlHash}`)
    }, [])

    return <Typography variant='h5' mt='30vh' textAlign='center'>
        Authenticated
    </Typography>
}
