import './DateSelector.scss'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import React, { type ReactElement } from 'react'
import Calendar from 'react-calendar'

interface Props {
    date: DateTime
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    onDateChange: (date: DateTime) => void
}

export const DateSelector = (props: Props): ReactElement => {
    return <Accordion
        disableGutters
        expanded={props.expanded}
        onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
    >
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
            <Typography component='div' noWrap flex='1 0 0' width={0}>
                    Date: {props.date.toLocaleString()}
            </Typography>
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
                            console.log(date)
                            const utc = DateTime.utc(date.getFullYear(), date.getMonth() + 1, date.getDate())
                            console.log(utc.toISO())
                            props.onDateChange(utc)
                        }}
                    />
                    : null
                }
            </Typography>
        </AccordionDetails>
    </Accordion>
}
