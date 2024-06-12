import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Button, TextField, Typography } from '@mui/material'
import React, { memo, type ReactElement, useState } from 'react'

import { type Operation } from '../../../../engine/model'
import { TagsSelect } from '../../select/TagsSelect'

interface Props {
    expanded: boolean
    onExpandedChange: (expanded: boolean) => void
    categories: readonly string[]
    tags: readonly string[]
    opType: Exclude<Operation['type'], 'deleted'>
    onTagsChanged: (newTags: readonly string[]) => void
}

export const TagsEditor = memo(function TagsEditor(props: Props): ReactElement {
    const [newTag, setNewTag] = useState('')
    const [addedTags, setAddedTags] = useState<readonly string[]>([])

    return (
        <Accordion
            disableGutters
            expanded={props.expanded}
            onChange={(_, expanded) => { props.onExpandedChange(expanded) }}
        >
            <AccordionSummary expandIcon={<FontAwesomeIcon icon={faChevronDown} />}>
                <Typography>{'Tags'}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <TagsSelect
                    opType={props.opType}
                    categories={props.categories}
                    addedTags={addedTags}
                    selected={props.tags}
                    onSelectedChange={props.onTagsChanged}
                />
            </AccordionDetails>
            <AccordionActions sx={{ gap: 1, alignItems: 'stretch' }}>
                <TextField
                    fullWidth
                    variant={'filled'}
                    size={'small'}
                    label={'New tag'}
                    value={newTag}
                    onChange={(ev) => { setNewTag(ev.target.value) }}
                />
                <Button onClick={() => {
                    const t = newTag.trim()
                    setAddedTags([t, ...addedTags])
                    props.onTagsChanged([...props.tags, t])
                    setNewTag('')
                }}
                >
                    {'Add'}
                </Button>
            </AccordionActions>
        </Accordion>
    )
})
