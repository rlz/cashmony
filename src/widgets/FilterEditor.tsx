import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material'
import React, { Fragment, type ReactElement, useState } from 'react'

import { deepEqual } from '../helpers/deepEqual'
import { showIf } from '../helpers/smallTools'
import { type Filter } from '../model/filter'
import { FullScreenModal } from './FullScreenModal'
import { Column, Row } from './generic/Containers'
import { DivBody2, PBody2, SpanBody2 } from './generic/Typography'
import { AccountsSelect } from './select/AccountsSelect'
import { CategoriesSelect } from './select/CategoriesSelect'
import { TagsSelect } from './select/TagsSelect'

interface Props {
    filter: Filter
    onClose: () => void
    onFilterChanged: (filter: Filter) => void
}

export function FilterEditor (props: Props): ReactElement {
    const [filter, setFilter] = useState(props.filter)

    return <FullScreenModal
        width='600px'
        title='Global filter'
        onClose={props.onClose}
    >
        <Column height={'100%'} width={'100%'}>
            <Column gap={1} p={1} overflow='auto'>
                <SearchFilter filter={filter} setFilter={setFilter} />
                <OpTypeFilter filter={filter} setFilter={setFilter} />
                <CategoriesFilter filter={filter} setFilter={setFilter} />
                <AccountsFilter filter={filter} setFilter={setFilter} />
                <TagsFilter filter={filter} setFilter={setFilter} />
            </Column>
            <Box p={1}>
                <Button
                    color='primary'
                    fullWidth
                    variant='contained'
                    disabled={deepEqual(props.filter, filter)}
                    onClick={() => { props.onFilterChanged(filter); props.onClose() } }
                >
                    {'Apply'}
                </Button>
            </Box>
        </Column>
    </FullScreenModal>
}

interface EditorProps {
    filter: Filter
    setFilter: (filter: Filter) => void
}

function SearchFilter ({ filter, setFilter }: EditorProps): ReactElement {
    return <FormControl variant='outlined' fullWidth>
        <InputLabel size='small'>Comment search</InputLabel>
        <OutlinedInput
            size='small'
            value={filter.search ?? ''}
            onChange={(ev) => {
                setFilter({
                    ...filter,
                    search: ev.target.value
                })
            }}
            endAdornment={
                showIf(
                    filter.search !== null,
                    <InputAdornment position='end'>
                        <IconButton
                            onClick={() => { setFilter({ ...filter, search: null }) }}
                            edge='end'
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </IconButton>
                    </InputAdornment>
                )
            }
            label='Search'
        />
    </FormControl>
}

function OpTypeFilter ({ filter, setFilter }: EditorProps): ReactElement {
    return <Paper sx={{ p: 1 }}>
        <PBody2 mb={1} flex='1 1 0'>Op. type:</PBody2>
        <ToggleButtonGroup
            fullWidth
            size='small'
            value={filter.opType}
            color='primary'
            onChange={(_, v) => {
                setFilter({ ...filter, opTypeMode: 'selected', opType: v })
            }}
        >
            <ToggleButton value='expense'>Expense</ToggleButton>
            <ToggleButton value='income'>Income</ToggleButton>
            <ToggleButton value='transfer'>Transfer</ToggleButton>
            <ToggleButton value='adjustment'>Adj</ToggleButton>
        </ToggleButtonGroup>
    </Paper>
}

function CategoriesFilter ({ filter, setFilter }: EditorProps): ReactElement {
    return <Paper sx={{ p: 1 }}>
        <Row alignItems='center' gap={1}>
            <SpanBody2 flex='1 1 0'>Categories:</SpanBody2>
            <ToggleButtonGroup
                exclusive
                size='small'
                value={filter.categoriesMode}
                color='primary'
                onChange={(_, v) => {
                    if (v !== null) {
                        setFilter({ ...filter, categoriesMode: v })
                    }
                }}
            >
                <ToggleButton value='all'>All</ToggleButton>
                <ToggleButton value='selected'>Selected</ToggleButton>
                <ToggleButton value='exclude'>Exclude</ToggleButton>
            </ToggleButtonGroup>
        </Row>
        {
            showIf(
                filter.categoriesMode !== 'all',
                <>
                    <DivBody2 mt={1}>
                        {
                            filter.categoriesMode !== 'all'
                                ? filter.categories.map((i, index) => {
                                    const el = <SpanBody2
                                        key={i}
                                        color='secondary.main'
                                        fontStyle={i === '' ? 'italic' : undefined}>
                                        {i === '' ? 'Uncategorized' : i}
                                    </SpanBody2>
                                    if (index === 0) {
                                        return el
                                    }
                                    return <Fragment key={`c-${i}`}>{', '}{el}</Fragment>
                                })
                                : null
                        }
                    </DivBody2>
                    <CategoriesSelect
                        sx={{ my: 1 }}
                        selected={filter.categories}
                        onSelectedChange={selected => {
                            setFilter({
                                ...filter,
                                categories: selected
                            })
                        }}
                        selectMany={true}
                        selectZero={true}
                        showUncategorized={true}
                    />
                </>
            )
        }
    </Paper>
}

function AccountsFilter ({ filter, setFilter }: EditorProps): ReactElement {
    return <Paper sx={{ p: 1 }}>
        <Row alignItems='center'>
            <SpanBody2 flex='1 1 0'>Accounts:</SpanBody2>
            <ToggleButtonGroup
                exclusive
                size='small'
                value={filter.accountsMode}
                color='primary'
                onChange={(_, v) => {
                    if (v !== null) {
                        setFilter({ ...filter, accountsMode: v })
                    }
                }}
            >
                <ToggleButton value='all'>All</ToggleButton>
                <ToggleButton value='selected'>Selected</ToggleButton>
                <ToggleButton value='exclude'>Exclude</ToggleButton>
            </ToggleButtonGroup>
        </Row>
        {
            showIf(
                filter.accountsMode !== 'all',
                <>
                    <DivBody2 mt={1}>
                        {
                            filter.accountsMode !== 'all'
                                ? filter.accounts.map((i, index) => {
                                    const el = <SpanBody2 key={i} color='secondary.main'>{i}</SpanBody2>
                                    if (index === 0) {
                                        return el
                                    }
                                    return <Fragment key={`c-${i}`}>{', '}{el}</Fragment>
                                })
                                : null
                        }
                    </DivBody2>
                    <AccountsSelect
                        sx={{ my: 1 }}
                        selected={filter.accounts}
                        onSelectedChange={selected => {
                            setFilter({
                                ...filter,
                                accounts: selected
                            })
                        }}
                        selectMany={true}
                        selectZero={true}
                        showHidden={true}
                    />
                </>
            )
        }
    </Paper>
}

function TagsFilter ({ filter, setFilter }: EditorProps): ReactElement {
    return <Paper sx={{ p: 1 }}>
        <Row alignItems='center'>
            <SpanBody2 flex='1 1 0'>Tags:</SpanBody2>
            <ToggleButtonGroup
                exclusive
                size='small'
                value={filter.tagsMode}
                color='primary'
                onChange={(_, v) => {
                    if (v !== null) {
                        setFilter({ ...filter, tagsMode: v })
                    }
                }}
            >
                <ToggleButton value='all'>All</ToggleButton>
                <ToggleButton value='selected'>Selected</ToggleButton>
                <ToggleButton value='exclude'>Exclude</ToggleButton>
            </ToggleButtonGroup>
        </Row>
        {
            showIf(
                filter.tagsMode !== 'all',
                <>
                    <DivBody2 mt={1}>
                        {
                            filter.tagsMode !== 'all'
                                ? filter.tags.map((i, index) => {
                                    const el = <SpanBody2 key={i} color='secondary.main'>{i}</SpanBody2>
                                    if (index === 0) {
                                        return el
                                    }
                                    return <Fragment key={`c-${i}`}>{', '}{el}</Fragment>
                                })
                                : null
                        }
                    </DivBody2>
                    <TagsSelect
                        sx={{ my: 1 }}
                        opType={null}
                        categories={[]}
                        addedTags={[]}
                        selected={filter.tags}
                        onSelectedChange={selected => {
                            setFilter({
                                ...filter,
                                tags: selected
                            })
                        }}
                    />
                </>
            )
        }
    </Paper>
}
