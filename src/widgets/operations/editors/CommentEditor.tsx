import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionDetails, AccordionSummary, TextField, Typography } from '@mui/material'
import React, { type ReactElement } from 'react'

interface Props {
    comment: string | null
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    onCommentChange: (comment: string | null) => void
}

export const CommentEditor = (props: Props): ReactElement => {
    return <Accordion
        disableGutters
        expanded={props.expanded}
        onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
    >
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
            <Typography>Comment</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <TextField
                label='Comment'
                size='small'
                fullWidth
                variant='filled'
                value={props.comment ?? ''}
                onChange={ev => {
                    const comment = ev.target.value
                    props.onCommentChange(comment !== '' ? comment : null)
                }}
            />
        </AccordionDetails>
    </Accordion>
}
