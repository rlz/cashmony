import { Button, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uuidv7 } from 'uuidv7'

import { useEngine } from '../../useEngine'
import { FullScreenModal } from '../../widgets/FullScreenModal'
import { Column } from '../../widgets/generic/Containers'

export function AddCategory({ onClose }: { onClose: () => void }): ReactElement {
    const engine = useEngine()
    const navigate = useNavigate()
    const [name, setName] = useState('')

    const save = (): void => {
        const trimmedName = name.trim()

        // reuse ids of deleted categories
        const id = engine.categories.find(i => i.deleted === true)?.id ?? uuidv7()

        engine.pushCategory({
            id,
            name: trimmedName,
            lastModified: DateTime.utc()
        })
        onClose()
        navigate(`/categories/${encodeURIComponent(id)}/modify`)
    }

    const exists = engine.hasCategoryWithName(name.trim()) && engine.getCategoryByName(name.trim()).deleted !== true

    return (
        <FullScreenModal title={'Add category'} onClose={onClose}>
            <Column gap={1} p={1}>
                <TextField
                    label={'Name'}
                    variant={'filled'}
                    size={'small'}
                    value={name}
                    error={name.trim() === '' || exists}
                    helperText={
                    name.trim() === ''
                        ? 'Empty'
                        : (exists ? 'Already exists' : undefined)
                }
                    onChange={(ev) => {
                        setName(ev.target.value)
                    }}
                    sx={{ flex: '1 0 0' }}
                />
                <Button
                    fullWidth
                    variant={'contained'}
                    disabled={name.trim() === '' || exists}
                    onClick={() => { void save() }}
                >
                    {'Create'}
                </Button>
            </Column>
        </FullScreenModal>
    )
}
