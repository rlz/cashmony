import { styled, Typography, useTheme } from '@mui/material'
import { JSX } from 'react'
import { match, P } from 'ts-pattern'

import { formatCurrency } from '../../helpers/currencies.js'

interface Props {
    currency: string
    periodPace: number | null
    perDayGoal?: number | null
    leftPerDay: number | null
}

const Table = styled('table')(() => {
    const theme = useTheme()

    return {
        margin: '0 auto',
        th: {
            paddingRight: theme.spacing(1)
        }
    }
})

export function ExpensesInfoTable({ currency, periodPace, perDayGoal, leftPerDay }: Props): JSX.Element {
    return (
        <Table>
            <tbody>
                <tr>
                    <th>{'Period pace (30d):'}</th>
                    <td>{match(periodPace).with(null, () => '-').otherwise(v => formatCurrency(v, currency))}</td>
                </tr>
                {
                    perDayGoal !== undefined
                    && (
                        <tr>
                            <th>{'Goal (30d):'}</th>
                            <td>{perDayGoal !== null ? formatCurrency(30 * perDayGoal, currency) : '-'}</td>
                        </tr>
                    )
                }
                <tr>
                    <th>{'Left per day:'}</th>
                    <td>
                        {
                            match(leftPerDay)
                                .with(null, () => '-')
                                .with(P.number.gt(0), v => formatCurrency(v, currency))
                                .otherwise(() => <Typography color={'warning.main'} sx={{ fontStyle: 'italic' }}>{'overspend'}</Typography>)
                        }
                    </td>
                </tr>
            </tbody>
        </Table>
    )
}
