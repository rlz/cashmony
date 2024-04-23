import { styled } from '@mui/material'
import { DateTime } from 'luxon'

export interface Point {
    date: DateTime
    value: number
}

export const PlotContainer = styled('div')(
    {
        '&': {
            figure: {
                margin: 0
            }
        }
    }
)

export function monthFormat(month: number): string {
    return ['Jan', 'Feb', 'Mar',
        'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep',
        'Oct', 'Nov', 'Dec'][month]
}
