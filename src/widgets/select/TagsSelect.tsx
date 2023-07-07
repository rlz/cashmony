import { type SxProps } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React from 'react'

import { type NotDeletedOperation } from '../../model/model'
import { mergeTags, TagsModel } from '../../model/tags'
import { ItemsSelect } from './ItemsSelect'

const tagsModel = TagsModel.instance()

interface Props {
    opType: NotDeletedOperation['type'] | null
    categories: readonly string[]
    addedTags: readonly string[]
    selected: readonly string[]
    onSelectedChange: (selected: string[]) => void
    sx?: SxProps
}

export const TagsSelect = observer((props: Props) => {
    const tags = [
        ...props.addedTags,
        ...mergeTags(
            props.categories.reduce<readonly string[]>((tags, cat) => [...tags, ...tagsModel.byCat.get(cat) ?? []], []),
            props.opType !== null ? tagsModel[props.opType] : [],
            tagsModel.all
        )
    ]

    return <ItemsSelect
        items={tags}
        selected={props.selected}
        onSelectedChange={props.onSelectedChange}
        selectMany={true}
        selectZero={true}
        sx={props.sx}
    />
})
