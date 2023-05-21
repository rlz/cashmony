import './DateSelector.scss'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Button, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement } from 'react'
import Calendar from 'react-calendar'

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
            <Typography>Date</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Typography
                component="div"
                color="primary.light"
                textAlign="center"
            >
                { props.expanded
                    ? <Calendar
                        value={props.date.toJSDate()}
                        onClickDay={(date) => {
                            const utc = DateTime.utc(date.getFullYear(), date.getMonth() + 1, date.getDate())
                            props.onDateChange(utc)
                        }}
                    />
                    : null
                }
            </Typography>
        </AccordionDetails>
        <AccordionActions>
            <Button onClick={() => {
                const now = DateTime.now()
                const utc = DateTime.utc(now.year, now.month, now.day).minus({ days: 1 })
                props.onDateChange(utc)
            }}>Yesterday</Button>
            <Button onClick={() => {
                const now = DateTime.now()
                const utc = DateTime.utc(now.year, now.month, now.day)
                props.onDateChange(utc)
            }}>Today</Button>
        </AccordionActions>
    </Accordion>
}
