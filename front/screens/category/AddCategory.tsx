import { Button, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uuidv7 } from 'uuidv7'

import { screenWidthIs } from '../../helpers/useWidth.js'
import { useEngine } from '../../useEngine.js'
import { FullScreenModal } from '../../widgets/FullScreenModal.js'
import { Column } from '../../widgets/generic/Containers.js'

export function AddCategory({ onClose }: { onClose: () => void }): ReactElement {
    const engine = useEngine()
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const smallScreen = screenWidthIs('xs', 'sm')

    const save = async () => {
        const trimmedName = name.trim()

        // reuse ids of deleted categories
        const id = engine.categories.find(i => i.deleted === true)?.id ?? uuidv7()

        engine.pushCategory({
            id,
            name: trimmedName,
            lastModified: DateTime.utc()
        })
        onClose()
        await navigate(`/categories/${encodeURIComponent(id)}/modify`)
    }

    const exists = engine.hasCategoryWithName(name.trim()) && engine.getCategoryByName(name.trim()).deleted !== true

    return (
        <FullScreenModal title={'Add category'} onClose={onClose}>
            <Column gap={1} p={1} minWidth={smallScreen ? undefined : '800px'}>
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
                    onClick={async () => { await save() }}
                >
                    {'Create'}
                </Button>
            </Column>
        </FullScreenModal>
    )
}
