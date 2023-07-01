import React, { useState, type ReactElement } from 'react'
import { FullScreenModal } from '../../FullScreenModal'
import { CategoriesModel } from '../../../model/categories'
import { Button, TextField } from '@mui/material'
import { DateTime } from 'luxon'

const categoriesModel = CategoriesModel.instance()

export function AddCategory ({ onClose }: { onClose: () => void }): ReactElement {
    const [name, setName] = useState('')

    const save = async (): Promise<void> => {
        await categoriesModel.put({
            name: name.trim(),
            lastModified: DateTime.utc()
        })
        onClose()
    }

    const cat = categoriesModel.categories.get(name.trim())
    const exists = cat !== undefined && cat.deleted !== true

    return <FullScreenModal title='Add category' onClose={onClose} gap={1}>
        <TextField
            label='Name'
            variant='filled'
            size='small'
            value={name}
            error={name.trim() === '' || exists }
            helperText={
                name.trim() === ''
                    ? 'Empty'
                    : (exists ? 'Already exists' : undefined)
            }
            onChange={ev => {
                setName(ev.target.value)
            }}
            sx={{ flex: '1 0 0' }}
        />
        <Button
            fullWidth
            variant='contained'
            disabled={ name.trim() === '' || exists }
            onClick={() => { void save() }}
        >Create</Button>
    </FullScreenModal>
}
