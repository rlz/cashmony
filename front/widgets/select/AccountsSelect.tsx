import { type SxProps } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React from 'react'

import { useEngine } from '../../useEngine'
import { ItemsSelect } from './ItemsSelect'

interface Props {
    selected: readonly string[]
    onSelectedChange: (selected: string[]) => void
    selectMany: boolean
    selectZero: boolean
    showHidden: boolean
    sx?: SxProps
}

export const AccountsSelect = observer((props: Props) => {
    const engine = useEngine()

    const accounts = engine.accountsSortedByUsage
        .values()
        .filter(acc => acc.deleted !== true && (!acc.hidden || props.showHidden))
        .map((acc) => {
            return {
                label: acc.name,
                value: acc.id
            }
        })
        .toArray()

    return (
        <ItemsSelect
            items={accounts}
            selected={props.selected}
            onSelectedChange={props.onSelectedChange}
            selectMany={props.selectMany}
            selectZero={props.selectZero}
            sx={props.sx}
        />
    )
})
