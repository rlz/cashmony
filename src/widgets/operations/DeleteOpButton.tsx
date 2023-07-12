import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Slide } from '@mui/material'
import { type TransitionProps } from '@mui/material/transitions'
import React, { type ReactElement } from 'react'

const Transition = React.forwardRef(function Transition (
    props: TransitionProps & {
        children: React.ReactElement<any, any>
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction={'down'} ref={ref} {...props} />
})

interface Props {
    onDelete: () => Promise<void>
}

export function DeleteOpButton ({ onDelete }: Props): ReactElement {
    const [open, setOpen] = React.useState(false)

    return <>
        <Button sx={{ mt: 2 }} color={'error'} fullWidth variant={'contained'} onClick={() => { setOpen(true) }}>{'Delete'}</Button>
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={() => { setOpen(false) }}
        >
            <DialogTitle>{'Confirmation'}</DialogTitle>
            <DialogContent>
                <DialogContentText>{'Are you sure that you want to delete this operation?'}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button color={'error'} onClick={() => { setOpen(false) }}>{'No'}</Button>
                <Button color={'primary'} onClick={() => { setOpen(false); setTimeout(() => { void onDelete() }, 0) }}>{'Yes'}</Button>
            </DialogActions>
        </Dialog>
    </>
}
