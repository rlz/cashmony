import React, { type ReactElement } from 'react'
import { useLocation } from 'react-router-dom'

export function AuthScreen (): ReactElement {
    const urlHash = useLocation().hash.slice(1)

    const params: Record<string, string> = {}

    urlHash.split('&').forEach(i => {
        const [param, value] = i.split('=')
        params[param] = decodeURIComponent(value)
    })

    if ('access_token' in params && 'expires_in' in params && 'scope' in params && 'token_type' in params) {
        window.opener.routerNavigate(`/post-auth?auth=${encodeURIComponent(params.access_token)}`)
        window.close()
        return <>Authenticated</>
    }

    throw Error(`Can not parse auth URL: ${urlHash}`)
}
