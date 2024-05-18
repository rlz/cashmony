import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, type ButtonProps, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, Slide } from '@mui/material'
import { type TransitionProps } from '@mui/material/transitions'
import React, { type PropsWithChildren, type ReactElement, useCallback, useState } from 'react'

import { runAsync, showIf } from '../../helpers/smallTools'

type Props = Omit<PropsWithChildren<ButtonProps>, 'action' | 'disabled'> & {
    confirmationTitle?: string
    confirmation?: string
    action: (() => Promise<void> | void) | null
}

export function ActionButton({ confirmationTitle, confirmation, action, children, ...btnProps }: Props): ReactElement {
    const [inProgress, setInProgress] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    const runAction = useCallback(() => {
        setInProgress(true)
        runAsync(async () => {
            try {
                if (action === null) {
                    return
                }

                await action()
            } finally {
                setInProgress(false)
            }
        })
    }, [action])

    return (
        <>
            <Button
                {...btnProps}
                disabled={action === null || inProgress}
                onClick={() => {
                    if (confirmation !== undefined) {
                        setDialogOpen(true)
                        return
                    }
                    runAction()
                }}
                sx={{ ...btnProps.sx ?? {}, gap: 1 }}
            >
                {inProgress
                    ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} pulse />
                            {children}
                        </>
                        )
                    : children}
            </Button>
            {
            showIf(
                dialogOpen,
                <Dialog
                    open={true}
                    TransitionComponent={Transition}
                    onClose={() => { setDialogOpen(false) }}
                >
                    <DialogTitle>{confirmationTitle ?? 'Confirmation'}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>{confirmation}</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button color={'error'} onClick={() => { setDialogOpen(false) }}>{'No'}</Button>
                        <Button color={'primary'} onClick={() => { setDialogOpen(false); runAction() }}>{'Yes'}</Button>
                    </DialogActions>
                </Dialog>

            )
        }
        </>
    )
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: React.ReactElement<any, any>
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction={'down'} ref={ref} {...props} />
})

interface ActionFabProps {
    action: (() => Promise<void> | void) | null
    bottom?: string
}

export function ActionFab(props: PropsWithChildren<ActionFabProps>): ReactElement {
    const [inProgress, setInProgress] = useState(false)

    return (
        <Fab
            color={'primary'}
            disabled={props.action === null || inProgress}
            sx={{ position: 'fixed', bottom: props.bottom ?? '70px', right: '20px' }}
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
            {inProgress ? <FontAwesomeIcon icon={faSpinner} pulse /> : props.children}
        </Fab>
    )
}
