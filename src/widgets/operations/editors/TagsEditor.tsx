import React, { useState, type ReactElement } from 'react'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Button, TextField, Typography } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { type Operation } from '../../../model/model'
import { TagsSelect } from '../../select/TagsSelect'

interface Props {
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    categories: readonly string[]
    tags: readonly string[]
    opType: Exclude<Operation['type'], 'deleted'>
    onTagsChanged: (newTags: readonly string[]) => void
}

export function TagsEditor (props: Props): ReactElement {
    const [newTag, setNewTag] = useState('')
    const [newTags, setNewTags] = useState<readonly string[]>([])

    return <Accordion
        disableGutters
        expanded={props.expanded}
        onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
    >
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
            <Typography>Tags</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <TagsSelect
                opType={props.opType}
                categories={props.categories}
                addedTags={newTags}
                selected={props.tags}
                onSelectedChange={props.onTagsChanged}
            />
        </AccordionDetails>
        <AccordionActions sx={{ gap: 1, alignItems: 'stretch' }}>
            <TextField
                fullWidth
                variant='filled'
                size='small'
                label='New tag'
                value={newTag}
                onChange={(ev) => { setNewTag(ev.target.value.trim()) }}
            />
            <Button onClick={() => {
                setNewTag('')
                setNewTags([newTag, ...newTags])
                props.onTagsChanged([...props.tags, newTag])
            }}>Add</Button>
        </AccordionActions>
    </Accordion>
}
