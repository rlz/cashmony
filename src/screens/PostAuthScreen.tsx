import React, { type ReactElement } from 'react'
import { Google } from '../google/google'
import { Navigate, useLocation } from 'react-router-dom'

export function PostAuthScreen (): ReactElement {
    const location = useLocation()

    if (!location.search.startsWith('?auth=')) {
        throw Error('Unexpected search string: ' + location.search)
    }

    const accessToken = location.search.slice(6)

    Google.instance().finishAuth(accessToken)

    return <Navigate to='/' />
}
