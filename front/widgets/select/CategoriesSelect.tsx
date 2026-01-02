import { type SxProps } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React, { useMemo } from 'react'

import { sortCategoriesByUsage } from '../../../engine/sortCategories.js'
import { useEngine } from '../../useEngine.js'
import { ItemsSelect } from './ItemsSelect.js'

interface Props {
    selected: readonly string[]
    onSelectedChange: (selected: string[]) => void
    selectMany: boolean
    selectZero: boolean
    sx?: SxProps
}

export const CategoriesSelect = observer((props: Props) => {
    const engine = useEngine()

    const categories = useMemo(
        () => {
            return sortCategoriesByUsage(engine)
                .values()
                .filter(cat => cat.deleted !== true)
                .map((cat) => {
                    return {
                        value: cat.id,
                        label: cat.name
                    }
                })
                .toArray()
        },
        [engine.operations]
    )

    return (
        <ItemsSelect
            items={categories}
            selected={props.selected}
            onSelectedChange={props.onSelectedChange}
            selectMany={props.selectMany}
            selectZero={props.selectZero}
            sx={props.sx}
        />
    )
})
