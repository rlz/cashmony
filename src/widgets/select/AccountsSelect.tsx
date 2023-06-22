import { observer } from 'mobx-react-lite'
import React from 'react'
import { ItemsSelect } from './ItemsSelect'
import { AccountsModel } from '../../model/accounts'
import { type SxProps } from '@mui/material'

const accountsModel = AccountsModel.instance()

interface Props {
    selected: readonly string[]
    onSelectedChange: (selected: readonly string[]) => void
    selectMany: boolean
    selectZero: boolean
    showHidden: boolean
    sx?: SxProps
}

export const AccountsSelect = observer((props: Props) => {
    const accounts = accountsModel.accountsSorted.filter(accName => {
        const acc = accountsModel.get(accName)
        return acc.deleted !== true && (!acc.hidden || props.showHidden)
    })

    return <ItemsSelect
        items={accounts}
        selected={props.selected}
        onSelectedChange={props.onSelectedChange}
        selectMany={props.selectMany}
        selectZero={props.selectZero}
        sx={props.sx}
    />
})
