import { observer } from 'mobx-react-lite'
import React from 'react'
import { CategoriesModel } from '../../model/categories'
import { type ItemType, ItemsSelect } from './ItemsSelect'
import { SpanBody2 } from '../Typography'
import { type SxProps } from '@mui/material'

const categoriesModel = CategoriesModel.instance()

interface Props {
    selected: readonly string[]
    onSelectedChange: (selected: string[]) => void
    selectMany: boolean
    selectZero: boolean
    showUncategorized?: boolean
    sx?: SxProps
}

export const CategoriesSelect = observer((props: Props) => {
    const categories: ItemType[] = []

    if (props.showUncategorized === true) {
        categories.push({
            value: '',
            label: <SpanBody2 fontStyle='italic'>Uncategorized</SpanBody2>
        })
    }

    categories.push(...categoriesModel.categoriesSorted.filter(catName => {
        const cat = categoriesModel.get(catName)
        return cat.deleted !== true
    }))

    return <ItemsSelect
        items={categories}
        selected={props.selected}
        onSelectedChange={props.onSelectedChange}
        selectMany={props.selectMany}
        selectZero={props.selectZero}
        sx={props.sx}
    />
})
