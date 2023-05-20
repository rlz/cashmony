import React, { useState, type ReactElement } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, IconButton, InputBase, Paper, Typography } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { TagsModel, mergeTags } from '../model/tags'
import { type Operation } from '../model/model'

interface Props {
    tags: readonly string[]
    opType: Exclude<Operation['type'], 'deleted'>
    onTagsChanged: (newTags: readonly string[]) => void
}

const tagsModel = TagsModel.instance()

export function TagsEditor ({ tags, opType, onTagsChanged }: Props): ReactElement {
    const [newTag, setNewTag] = useState('')
    const [newTags, setNewTags] = useState<readonly string[]>([])

    return <Accordion>
        <AccordionSummary
            expandIcon={<FontAwesomeIcon icon={faChevronDown} />}
            aria-controls="panel1a-content"
            id="panel1a-header"
        >
            <Typography component='div' noWrap flex='1 0 0' width={0}>Tags: {tags.join(', ')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={1} maxHeight="128px" overflow="scroll">
                {[...newTags, ...mergeTags(tagsModel[opType], tagsModel.all)].map(t => {
                    if (tags.includes(t)) {
                        return <a key={t} onClick={() => { onTagsChanged(tags.filter(i => i !== t)) }}>
                            <Chip color="info" size='small' label={t}/>
                        </a>
                    }
                    return <a key={t} onClick={() => { onTagsChanged([...tags, t]) }}>
                        <Chip size='small' label={t}/>
                    </a>
                })}
            </Box>
            <Box>
                <Paper
                    elevation={2}
                    component="form"
                    sx={{ p: '2px 4px', display: 'flex', alignItems: 'center' }}
                >
                    <InputBase
                        sx={{ ml: 1, flex: 1 }}
                        placeholder="New tag"
                        value={newTag}
                        onChange={(ev) => { setNewTag(ev.target.value) }}
                    />
                    <IconButton type="button" sx={{ p: '10px' }} onClick={() => {
                        setNewTag('')
                        setNewTags([newTag, ...newTags])
                        onTagsChanged([...tags, newTag])
                    }}>
                        <FontAwesomeIcon icon={faCheck} />
                    </IconButton>
                </Paper>
            </Box>
        </AccordionDetails>
    </Accordion>
}
