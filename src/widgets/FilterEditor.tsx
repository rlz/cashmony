import React, { useState, type ReactElement } from 'react'
import { type Filter } from '../model/filter'
import { FullScreenModal } from './FullScreenModal'
import { CategoriesSelect } from './select/CategoriesSelect'
import { FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { showIf } from '../helpers/smallTools'
import { Column, Row } from './Containers'
import { PBody2, SpanBody2 } from './Typography'
import { deepEqual } from '../helpers/deepEqual'
import { AccountsSelect } from './select/AccountsSelect'
import { TagsSelect } from './select/TagsSelect'

interface Props {
    filter: Filter
    onClose: () => void
    onFilterChanged: (filter: Filter) => void
}

export function FilterEditor (props: Props): ReactElement {
    const [filter, setFilter] = useState(props.filter)

    return <FullScreenModal
        onClose={props.onClose}
        onSave={deepEqual(props.filter, filter) ? null : () => { props.onFilterChanged(filter); props.onClose() }}
    >
        <Column gap={1}>
            <SearchFilter filter={filter} setFilter={setFilter} />
            <OpTypeFilter filter={filter} setFilter={setFilter} />
            <CategoriesFilter filter={filter} setFilter={setFilter} />
            <AccountsFilter filter={filter} setFilter={setFilter} />
            <TagsFilter filter={filter} setFilter={setFilter} />
        </Column>
    </FullScreenModal>
}

interface EditorProps {
    filter: Filter
    setFilter: (filter: Filter) => void
}

function SearchFilter ({ filter, setFilter }: EditorProps): ReactElement {
    return <FormControl variant="outlined" fullWidth>
        <InputLabel size='small'>Search</InputLabel>
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
                    <InputAdornment position="end">
                        <IconButton
                            onClick={() => { setFilter({ ...filter, search: null }) }}
                            edge="end"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </IconButton>
                    </InputAdornment>
                )
            }
            label="Search"
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
            onChange={(_, v) => {
                setFilter({ ...filter, opTypeMode: 'selected', opType: v })
            }}
        >
            <ToggleButton value="expense">Expense</ToggleButton>
            <ToggleButton value="income">Income</ToggleButton>
            <ToggleButton value="transfer">Transfer</ToggleButton>
            <ToggleButton value="adjustment">Adj</ToggleButton>
        </ToggleButtonGroup>
    </Paper>
}

function CategoriesFilter ({ filter, setFilter }: EditorProps): ReactElement {
    return <Paper sx={{ p: 1 }}>
        <Row alignItems='center'>
            <SpanBody2 flex='1 1 0'>Categories:</SpanBody2>
            <ToggleButtonGroup
                exclusive
                size='small'
                value={filter.categoriesMode}
                onChange={(_, v) => {
                    if (v !== null) {
                        setFilter({ ...filter, categoriesMode: v })
                    }
                }}
            >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="selected">Selected</ToggleButton>
                <ToggleButton value="exclude">Exclude</ToggleButton>
            </ToggleButtonGroup>
        </Row>
        {
            showIf(
                filter.categoriesMode !== 'all',
                <CategoriesSelect
                    sx={{ mt: 1 }}
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
                />)
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
                onChange={(_, v) => {
                    if (v !== null) {
                        setFilter({ ...filter, accountsMode: v })
                    }
                }}
            >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="selected">Selected</ToggleButton>
                <ToggleButton value="exclude">Exclude</ToggleButton>
            </ToggleButtonGroup>
        </Row>
        {
            showIf(
                filter.accountsMode !== 'all',
                <AccountsSelect
                    sx={{ mt: 1 }}
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
                />)
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
                onChange={(_, v) => {
                    if (v !== null) {
                        setFilter({ ...filter, tagsMode: v })
                    }
                }}
            >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="selected">Selected</ToggleButton>
                <ToggleButton value="exclude">Exclude</ToggleButton>
            </ToggleButtonGroup>
        </Row>
        {
            showIf(
                filter.tagsMode !== 'all',
                <TagsSelect
                    sx={{ mt: 1 }}
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
                />)
        }
    </Paper>
}
