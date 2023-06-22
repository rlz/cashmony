import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import React, { useState, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { Operations } from '../model/stats'
import { type DeletedOperation } from '../model/model'
import { OperationsModel } from '../model/operations'
import { DateTime } from 'luxon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { AccountsModel } from '../model/accounts'

interface Props {
    name: string
    open: boolean
    setOpen: (open: boolean) => void
}

export function DeleteAccount ({ name, open, setOpen }: Props): ReactElement {
    const [delInProcess, setDelInProcess] = useState(false)
    const navigate = useNavigate()

    const opsCount = Operations.all().keepAccounts(name).count()

    return <Dialog
        open={open}
        onClose={() => { setOpen(false) }}
    >
        <DialogTitle>Delete account?</DialogTitle>
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
            <Button variant='contained' onClick={() => { setOpen(false) }}>Cancel</Button>
            <Button
                variant='contained'
                color='error'
                onClick={() => {
                    setDelInProcess(true)
                    setTimeout(() => {
                        const action = async (): Promise<void> => {
                            try {
                                await deleteAccount(name)
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
                    : null} Delete
            </Button>
        </DialogActions>
    </Dialog>
}

const operationsModel = OperationsModel.instance()
const accountsModel = AccountsModel.instance()

async function deleteAccount (accName: string): Promise<void> {
    const ops: DeletedOperation[] = [...Operations.all().keepAccounts(accName).operations()].map(op => {
        return {
            id: op.id,
            type: 'deleted'
        }
    })
    await operationsModel.put(ops)
    const acc = accountsModel.get(accName)
    await accountsModel.put({
        ...acc,
        lastModified: DateTime.utc(),
        deleted: true
    })
}
