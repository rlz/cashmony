import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, type ButtonProps, Fab } from '@mui/material'
import React, { type PropsWithChildren, type ReactElement, useState } from 'react'

import { runAsync } from '../../helpers/smallTools'

type Props = Omit<PropsWithChildren<ButtonProps>, 'action' | 'disabled'> & {
    action: (() => Promise<void>) | null
}

export function ActionButton (props: Props): ReactElement {
    const [inProgress, setInProgress] = useState(false)

    const action = props.action
    const btnProps: Partial<Props> = { ...props }
    delete btnProps.action

    return <Button
        {...btnProps}
        disabled={props.action === null}
        onClick={() => {
            setInProgress(true)
            runAsync(async () => {
                if (action === null) {
                    return
                }

                await action()
                setInProgress(false)
            })
        }}
    >
        {inProgress ? <FontAwesomeIcon icon={faSpinner} pulse/> : props.children}
    </Button>
}

interface ActionFabProps {
    action: (() => Promise<void>) | null
    bottom?: string
}

export function ActionFab (props: PropsWithChildren<ActionFabProps>): ReactElement {
    const [inProgress, setInProgress] = useState(false)

    return <Fab
        color={'primary'}
        disabled={props.action === null}
        sx={{ position: 'absolute', bottom: props.bottom ?? '70px', right: '20px' }}
        onClick={() => {
            setInProgress(true)
            runAsync(async () => {
                if (props.action === null) {
                    return
                }

                await props.action()
                setInProgress(false)
            })
        }}
    >
        {inProgress ? <FontAwesomeIcon icon={faSpinner} pulse/> : props.children}
    </Fab>
}
