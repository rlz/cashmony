import { Box, Chip, type SxProps } from '@mui/material'
import React, { type ReactElement } from 'react'
import { match, P } from 'ts-pattern'

export type ItemType = string | { value: string, label: string | ReactElement }
export type ItemsType = ReadonlyArray<string | { value: string, label: string | ReactElement }>

interface Props {
    items: ItemsType
    selected: readonly string[]
    onSelectedChange: (selected: string[]) => void
    selectMany: boolean
    selectZero: boolean
    sx?: SxProps
}

export function ItemsSelect (props: Props): ReactElement {
    const selected = new Set(props.selected)

    return <Box display='flex' flexWrap='wrap' gap={1} maxHeight='128px' overflow='scroll' sx={props.sx}>
        { props.items.map(i => {
            const v = match(i).with(P.string, v => v).otherwise(v => v.value)
            const label = match(i).with(P.string, v => v).otherwise(v => v.label)
            if (selected.has(v)) {
                const chip = <Chip key={v} color='primary' size='small' label={label}/>

                if (props.selectZero || (props.selectMany && selected.size > 1)) {
                    return <a
                        key={v}
                        onClick={() => {
                            props.onSelectedChange(props.selected.filter(s => s !== v))
                        }}
                    >
                        {chip}
                    </a>
                }
                return chip
            }

            return <a
                key={v}
                onClick={() => {
                    if (props.selectMany) {
                        props.onSelectedChange([...selected, v])
                    } else {
                        props.onSelectedChange([v])
                    }
                }}
            >
                <Chip size='small' label={label}/>
            </a>
        })}
    </Box>
}
