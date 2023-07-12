import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CategoriesModel } from '../model/categories'
import { type NotDeletedOperation } from '../model/model'
import { OperationsModel } from '../model/operations'
import { Operations } from '../model/stats'

interface Props {
    name: string
    open: boolean
    setOpen: (open: boolean) => void
}

export function DeleteCategory ({ name, open, setOpen }: Props): ReactElement {
    const [delInProcess, setDelInProcess] = useState(false)
    const navigate = useNavigate()

    const opsCount = Operations
        .all()
        .keepTypes('expense', 'income')
        .keepCategories(name)
        .skipUncategorized()
        .count()

    return <Dialog
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
                                await deleteCategory(name)
                            } finally {
                                setDelInProcess(true)
                                navigate('/categories')
                            }
                        }
                        void action()
                    })
                }}
                sx={{ gap: 1 }}
            >
                { delInProcess
                    ? <FontAwesomeIcon icon={faSpinner} pulse />
                    : null}{' Delete'}
            </Button>
        </DialogActions>
    </Dialog>
}

const operationsModel = OperationsModel.instance()
const categoriesModel = CategoriesModel.instance()

async function deleteCategory (catName: string): Promise<void> {
    const ops: NotDeletedOperation[] = [
        ...Operations
            .all()
            .keepTypes('expense', 'income')
            .keepCategories(catName)
            .operations()
    ].map(op => {
        if (op.type !== 'income' && op.type !== 'expense') {
            throw Error('Expect only income and expenses here')
        }

        return {
            ...op,
            categories: op.categories.filter(c => c.name !== catName)
        }
    })
    await operationsModel.put(ops)
    const cat = categoriesModel.get(catName)
    await categoriesModel.put({
        ...cat,
        lastModified: DateTime.utc(),
        deleted: true
    })
}
