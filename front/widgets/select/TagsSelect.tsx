import { type SxProps } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'

import { type NotDeletedOperation } from '../../../engine/model'
import { mergeTags, TagsEngine } from '../../../engine/tags'
import { deepEqual } from '../../helpers/deepEqual'
import { useEngine } from '../../useEngine'
import { ItemsSelect } from './ItemsSelect'

interface Props {
    opType: NotDeletedOperation['type'] | null
    categories: readonly string[]
    addedTags: readonly string[]
    selected: readonly string[]
    onSelectedChange: (selected: string[]) => void
    sx?: SxProps
}

export const TagsSelect = observer((props: Props) => {
    const engine = useEngine()
    const [tags, setTags] = useState<string[]>([])

    useEffect(
        () => {
            const tagsEngine = new TagsEngine(engine)

            const newTags = mergeTags(
                props.addedTags,
                props.categories.reduce<readonly string[]>((tags, cat) => [...tags, ...tagsEngine.byCat.get(cat) ?? []], []),
                props.opType !== null ? tagsEngine[props.opType] : [],
                tagsEngine.all
            )
            if (!deepEqual(tags, newTags)) {
                setTags(newTags)
            }
        },
        [props.addedTags, props.categories, props.opType]
    )

    return (
        <ItemsSelect
            items={tags.map((t) => { return { label: t, value: t } })}
            selected={props.selected}
            onSelectedChange={props.onSelectedChange}
            selectMany={true}
            selectZero={true}
            sx={props.sx}
        />
    )
})
