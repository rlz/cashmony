import React, { useState, type ReactElement } from 'react'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Button, Chip, TextField, Typography } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { TagsModel, mergeTags } from '../model/tags'
import { type Operation } from '../model/model'

interface Props {
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    tags: readonly string[]
    opType: Exclude<Operation['type'], 'deleted'>
    onTagsChanged: (newTags: readonly string[]) => void
}

const tagsModel = TagsModel.instance()

export function TagsEditor (props: Props): ReactElement {
    const [newTag, setNewTag] = useState('')
    const [newTags, setNewTags] = useState<readonly string[]>([])

    return <Accordion
        disableGutters
        expanded={props.expanded}
        onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
    >
        <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />} >
            <Typography component='div' noWrap flex='1 0 0' width={0}>Tags: {props.tags.join(', ')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={1} maxHeight="128px" overflow="scroll">
                {[...newTags, ...mergeTags(tagsModel[props.opType], tagsModel.all)].map(t => {
                    if (props.tags.includes(t)) {
                        return <a
                            key={t}
                            onClick={() => {
                                props.onTagsChanged(props.tags.filter(i => i !== t))
                            }}
                        >
                            <Chip color="primary" size='small' label={t}/>
                        </a>
                    }
                    return <a
                        key={t}
                        onClick={() => {
                            props.onTagsChanged([...props.tags, t])
                        }}
                    >
                        <Chip size='small' label={t}/>
                    </a>
                })}
            </Box>
            <Box mt={1}>
                <TextField
                    fullWidth
                    variant="filled"
                    size='small'
                    label="New tag"
                    value={newTag}
                    onChange={(ev) => { setNewTag(ev.target.value) }}
                />
            </Box>
        </AccordionDetails>
        <AccordionActions>
            <Button onClick={() => {
                setNewTag('')
                setNewTags([newTag, ...newTags])
                props.onTagsChanged([...props.tags, newTag])
            }}>Add</Button>
        </AccordionActions>
    </Accordion>
}
