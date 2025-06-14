import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Engine } from '../../engine/engine'
import { type NotDeletedOperation } from '../../engine/model'
import { PE } from '../../engine/predicateExpression'
import { countOperations, listOperations } from '../../engine/stats'
import { useEngine } from '../useEngine'

interface Props {
    id: string
    open: boolean
    setOpen: (open: boolean) => void
}

export function DeleteCategory({ id, open, setOpen }: Props): ReactElement {
    const engine = useEngine()
    const [delInProcess, setDelInProcess] = useState(false)
    const navigate = useNavigate()

    const opsCount = countOperations(engine, PE.cat(id), null)

    return (
        <Dialog
            open={open}
            onClose={() => { setOpen(false) }}
        >
            <DialogTitle>{'Delete category?'}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {
                        opsCount === 0
                            ? 'Category was never used in operations'
                            : `Category was used in ${opsCount} operations`
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
                                    deleteCategory(id, engine)
                                } finally {
                                    setDelInProcess(true)
                                    await navigate('/categories')
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

function deleteCategory(catId: string, engine: Engine): void {
    const ops: NotDeletedOperation[] = [...listOperations(engine, PE.cat(catId), null)].map((op) => {
        if (op.type !== 'income' && op.type !== 'expense') {
            throw Error('Expect only income and expenses here')
        }

        return {
            ...op,
            categories: op.categories.filter(c => c.id !== catId)
        }
    })
    engine.pushOperations(ops)
    const cat = engine.getCategory(catId)
    engine.pushCategory({
        ...cat,
        lastModified: DateTime.utc(),
        deleted: true
    })
}
