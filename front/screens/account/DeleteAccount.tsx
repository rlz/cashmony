import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Engine } from '../../../engine/engine'
import { type DeletedOperation } from '../../../engine/model'
import { PE } from '../../../engine/predicateExpression'
import { countOperations, listOperations } from '../../../engine/stats'
import { useEngine } from '../../useEngine'

interface Props {
    id: string
    open: boolean
    setOpen: (open: boolean) => void
}

export function DeleteAccount({ id, open, setOpen }: Props): ReactElement {
    const engine = useEngine()
    const [delInProcess, setDelInProcess] = useState(false)
    const navigate = useNavigate()

    const opsCount = countOperations(engine, PE.account(id), null)

    return (
        <Dialog
            open={open}
            onClose={() => { setOpen(false) }}
        >
            <DialogTitle>{'Delete account?'}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {
                    opsCount === 0
                        ? 'No operation exists on this account'
                        : `This will delete ${opsCount} operations on this account`
                }
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button variant={'contained'} onClick={() => { setOpen(false) }}>{'Cancel'}</Button>
                <Button
                    variant={'contained'}
                    color={'error'}
                    onClick={() => {
                        setDelInProcess(true)
                        setTimeout(() => {
                            const action = async (): Promise<void> => {
                                try {
                                    await deleteAccount(id, engine)
                                } finally {
                                    setDelInProcess(true)
                                    navigate('/accounts')
                                }
                            }
                            void action()
                        })
                    }}
                    sx={{ gap: 1 }}
                >
                    { delInProcess
                        ? <FontAwesomeIcon icon={faSpinner} pulse />
                        : null}
                    {' Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

async function deleteAccount(accId: string, engine: Engine): Promise<void> {
    const ops: DeletedOperation[] = [...listOperations(engine, PE.account(accId), null)].map((op) => {
        return {
            id: op.id,
            type: 'deleted'
        }
    })
    engine.pushOperations(ops)
    const acc = engine.getAccount(accId)
    engine.pushAccount({
        ...acc,
        lastModified: DateTime.utc(),
        deleted: true
    })
}
