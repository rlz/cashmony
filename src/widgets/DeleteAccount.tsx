import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AccountsModel } from '../model/accounts'
import { type DeletedOperation } from '../model/model'
import { OperationsModel } from '../model/operations'
import { PE } from '../model/predicateExpression'
import { countOperations, listOperations } from '../model/stats'

interface Props {
    name: string
    open: boolean
    setOpen: (open: boolean) => void
}

export function DeleteAccount({ name, open, setOpen }: Props): ReactElement {
    const [delInProcess, setDelInProcess] = useState(false)
    const navigate = useNavigate()

    const opsCount = countOperations(PE.account(name), null)

    return <Dialog
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
                    : null}
                {' Delete'}
            </Button>
        </DialogActions>
    </Dialog>
}

const operationsModel = OperationsModel.instance()
const accountsModel = AccountsModel.instance()

async function deleteAccount(accName: string): Promise<void> {
    const ops: DeletedOperation[] = [...listOperations(PE.account(accName), null)].map((op) => {
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
