import './DateSelector.scss'

import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Button, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement } from 'react'
import Calendar from 'react-calendar'

import { utcToday } from '../../../helpers/dates'
import { AppState } from '../../../model/appState'

const appState = AppState.instance()

interface Props {
    date: DateTime
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    onDateChange: (date: DateTime) => void
}

export const DateEditor = (props: Props): ReactElement => {
    return <Accordion
        disableGutters
        expanded={props.expanded}
        onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
    >
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
            <Typography>{'Date'}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            { props.expanded
                ? <Calendar
                    maxDate={appState.today.toJSDate()}
                    value={props.date.toJSDate()}
                    onClickDay={(date) => {
                        const utc = DateTime.utc(date.getFullYear(), date.getMonth() + 1, date.getDate())
                        props.onDateChange(utc)
                    }}
                />
                : null
            }
        </AccordionDetails>
        <AccordionActions>
            <Button onClick={() => {
                const utc = utcToday().minus({ days: 1 })
                props.onDateChange(utc)
            }}>{'Yesterday'}</Button>
            <Button onClick={() => {
                const utc = utcToday()
                props.onDateChange(utc)
            }}>{'Today'}</Button>
        </AccordionActions>
    </Accordion>
}
