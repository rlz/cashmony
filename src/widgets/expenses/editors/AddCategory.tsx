import { Button, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CategoriesModel } from '../../../model/categories'
import { FullScreenModal } from '../../FullScreenModal'
import { Column } from '../../generic/Containers'

const categoriesModel = CategoriesModel.instance()

export function AddCategory ({ onClose }: { onClose: () => void }): ReactElement {
    const navigate = useNavigate()
    const [name, setName] = useState('')

    const save = async (): Promise<void> => {
        const trimmedName = name.trim()
        await categoriesModel.put({
            name: trimmedName,
            lastModified: DateTime.utc()
        })
        onClose()
        navigate(`/categories/${encodeURIComponent(trimmedName)}/modify`)
    }

    if (categoriesModel.categories === null) {
        return <></>
    }

    const cat = categoriesModel.categories.get(name.trim())
    const exists = cat !== undefined && cat.deleted !== true

    return <FullScreenModal title={'Add category'} onClose={onClose}>
        <Column gap={1} p={1}>
            <TextField
                label={'Name'}
                variant={'filled'}
                size={'small'}
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
                variant={'contained'}
                disabled={ name.trim() === '' || exists }
                onClick={() => { void save() }}
            >
                {'Create'}
            </Button>
        </Column>
    </FullScreenModal>
}
