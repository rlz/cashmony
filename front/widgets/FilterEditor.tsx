import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Clear } from '@mui/icons-material'
import { Box, Button, FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import React, { Fragment, type ReactElement, useState } from 'react'

import { Filter } from '../../engine/model.js'
import { deepEqual } from '../helpers/deepEqual.js'
import { showIf } from '../helpers/smallTools.js'
import { useEngine } from '../useEngine.js'
import { FullScreenModal } from './FullScreenModal.js'
import { AccountsSelect } from './select/AccountsSelect.js'
import { CategoriesSelect } from './select/CategoriesSelect.js'
import { TagsSelect } from './select/TagsSelect.js'

interface Props {
    filter: Filter
    onClose: () => void
    onFilterChanged: (filter: Filter) => void
}

export function FilterEditor(props: Props): ReactElement {
    const [filter, setFilter] = useState(props.filter)

    return (
        <FullScreenModal
            width={'600px'}
            title={'Global filter'}
            onClose={props.onClose}
        >
            <Stack direction={'column'} sx={{ height: '100%', width: '100%' }}>
                <Stack direction={'column'} sx={{ gap: 1, p: 1, overflow: 'auto' }}>
                    <SearchFilter filter={filter} setFilter={setFilter} />
                    <OpTypeFilter filter={filter} setFilter={setFilter} />
                    <CategoriesFilter filter={filter} setFilter={setFilter} />
                    <AccountsFilter filter={filter} setFilter={setFilter} />
                    <TagsFilter filter={filter} setFilter={setFilter} />
                </Stack>
                <Box sx={{ p: 1 }}>
                    <Button
                        color={'primary'}
                        fullWidth
                        variant={'contained'}
                        disabled={deepEqual(props.filter, filter)}
                        onClick={() => { props.onFilterChanged(filter); props.onClose() }}
                    >
                        {'Apply'}
                    </Button>
                </Box>
            </Stack>
        </FullScreenModal>
    )
}

interface EditorProps {
    filter: Filter
    setFilter: (filter: Filter) => void
}

function SearchFilter({ filter, setFilter }: EditorProps): ReactElement {
    return (
        <FormControl variant={'outlined'} fullWidth>
            <InputLabel size={'small'}>{'Comment search'}</InputLabel>
            <OutlinedInput
                size={'small'}
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
                        <InputAdornment position={'end'}>
                            <IconButton
                                onClick={() => { setFilter({ ...filter, search: null }) }}
                                edge={'end'}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </IconButton>
                        </InputAdornment>
                    )
                }
                label={'Search'}
            />
        </FormControl>
    )
}

function OpTypeFilter({ filter, setFilter }: EditorProps): ReactElement {
    return (
        <Paper sx={{ p: 1 }}>
            <Typography component={'p'} variant={'body2'} sx={{ mb: 1, flex: '1 1 0' }}>{'Op. type:'}</Typography>
            <ToggleButtonGroup
                fullWidth
                size={'small'}
                value={filter.opType}
                color={'primary'}
                onChange={(_, v) => {
                    setFilter({ ...filter, opTypeMode: 'selected', opType: v })
                }}
            >
                <ToggleButton value={'expense'}>{'Expense'}</ToggleButton>
                <ToggleButton value={'income'}>{'Income'}</ToggleButton>
                <ToggleButton value={'transfer'}>{'Transfer'}</ToggleButton>
                <ToggleButton value={'adjustment'}>{'Adj'}</ToggleButton>
            </ToggleButtonGroup>
        </Paper>
    )
}

function CategoriesFilter({ filter, setFilter }: EditorProps): ReactElement {
    const engine = useEngine()

    return (
        <Paper sx={{ p: 1 }}>
            <Stack direction={'row'} sx={{ alignItems: 'center', gap: 1 }}>
                <Typography component={'span'} variant={'body2'} sx={{ flex: '1 1 0' }}>{'Categories:'}</Typography>
                <ToggleButtonGroup
                    exclusive
                    size={'small'}
                    value={filter.categoriesMode}
                    color={'primary'}
                    onChange={(_, v) => {
                        if (v !== null) {
                            setFilter({ ...filter, categoriesMode: v })
                        }
                    }}
                >
                    <ToggleButton value={'all'}>{'All'}</ToggleButton>
                    <ToggleButton value={'selected'}>{'Selected'}</ToggleButton>
                    <ToggleButton value={'exclude'}>{'Exclude'}</ToggleButton>
                </ToggleButtonGroup>
            </Stack>
            {
                showIf(
                    filter.categoriesMode !== 'all',
                    <>
                        <Stack direction={'row'} sx={{ mt: 1, alignItems: 'center' }}>
                            <Box sx={{ flexGrow: 1 }}>
                                {
                                    filter.categoriesMode !== 'all'
                                        ? filter.categories.map((i, index) => {
                                                const el = (
                                                    <Typography
                                                        key={i}
                                                        component={'span'}
                                                        variant={'body2'}
                                                        sx={{ color: 'secondary.main' }}
                                                    >
                                                        {engine.categoriesById[i]?.name ?? i}
                                                    </Typography>
                                                )
                                                if (index === 0) {
                                                    return el
                                                }
                                                return (
                                                    <Fragment key={`c-${i}`}>
                                                        {', '}
                                                        {el}
                                                    </Fragment>
                                                )
                                            })
                                        : null
                                }
                            </Box>
                            <Box>
                                <IconButton onClick={() => setFilter({ ...filter, categories: [] })}>
                                    <Clear />
                                </IconButton>
                            </Box>
                        </Stack>
                        <CategoriesSelect
                            sx={{ my: 1 }}
                            selected={filter.categories}
                            onSelectedChange={(selected) => {
                                setFilter({
                                    ...filter,
                                    categories: selected
                                })
                            }}
                            selectMany={true}
                            selectZero={true}
                        />
                    </>
                )
            }
        </Paper>
    )
}

function AccountsFilter({ filter, setFilter }: EditorProps): ReactElement {
    const engine = useEngine()

    return (
        <Paper sx={{ p: 1 }}>
            <Stack direction={'row'} sx={{ alignItems: 'center' }}>
                <Typography component={'span'} variant={'body2'} sx={{ flex: '1 1 0' }}>{'Accounts:'}</Typography>
                <ToggleButtonGroup
                    exclusive
                    size={'small'}
                    value={filter.accountsMode}
                    color={'primary'}
                    onChange={(_, v) => {
                        if (v !== null) {
                            setFilter({ ...filter, accountsMode: v })
                        }
                    }}
                >
                    <ToggleButton value={'all'}>{'All'}</ToggleButton>
                    <ToggleButton value={'selected'}>{'Selected'}</ToggleButton>
                    <ToggleButton value={'exclude'}>{'Exclude'}</ToggleButton>
                </ToggleButtonGroup>
            </Stack>
            {
                showIf(
                    filter.accountsMode !== 'all',
                    <>
                        <Stack direction={'row'} sx={{ mt: 1, alignItems: 'center' }}>
                            <Typography component={'div'} variant={'body2'} sx={{ flexGrow: 1 }}>
                                {
                                    filter.accountsMode !== 'all'
                                        ? filter.accounts.map((i, index) => {
                                                const el = (
                                                    <Typography component={'span'} variant={'body2'} sx={{ color: 'secondary.main' }} key={i}>
                                                        {engine.accountsById[i]?.name ?? i}
                                                    </Typography>
                                                )
                                                if (index === 0) {
                                                    return el
                                                }
                                                return (
                                                    <Fragment key={`c-${i}`}>
                                                        {', '}
                                                        {el}
                                                    </Fragment>
                                                )
                                            })
                                        : null
                                }
                            </Typography>
                            <Box>
                                <IconButton onClick={() => setFilter({ ...filter, accounts: [] })}>
                                    <Clear />
                                </IconButton>
                            </Box>
                        </Stack>
                        <AccountsSelect
                            sx={{ my: 1 }}
                            selected={filter.accounts}
                            onSelectedChange={(selected) => {
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
    )
}

function TagsFilter({ filter, setFilter }: EditorProps): ReactElement {
    return (
        <Paper sx={{ p: 1 }}>
            <Stack direction={'row'} sx={{ alignItems: 'center' }}>
                <Typography component={'span'} variant={'body2'} sx={{ flex: '1 1 0' }}>{'Tags:'}</Typography>
                <ToggleButtonGroup
                    exclusive
                    size={'small'}
                    value={filter.tagsMode}
                    color={'primary'}
                    onChange={(_, v) => {
                        if (v !== null) {
                            setFilter({ ...filter, tagsMode: v })
                        }
                    }}
                >
                    <ToggleButton value={'all'}>{'All'}</ToggleButton>
                    <ToggleButton value={'selected'}>{'Selected'}</ToggleButton>
                    <ToggleButton value={'exclude'}>{'Exclude'}</ToggleButton>
                </ToggleButtonGroup>
            </Stack>
            {
                showIf(
                    filter.tagsMode !== 'all',
                    <>
                        <Stack direction={'row'} sx={{ alignItems: 'center', mt: 1 }}>
                            <Typography component={'div'} variant={'body2'} sx={{ flexGrow: 1 }}>
                                {
                                    filter.tagsMode !== 'all'
                                        ? filter.tags.map((i, index) => {
                                                const el = <Typography component={'span'} variant={'body2'} sx={{ color: 'secondary.main' }} key={i}>{i}</Typography>
                                                if (index === 0) {
                                                    return el
                                                }
                                                return (
                                                    <Fragment key={`c-${i}`}>
                                                        {', '}
                                                        {el}
                                                    </Fragment>
                                                )
                                            })
                                        : null
                                }
                            </Typography>
                            <Box>
                                <IconButton onClick={() => setFilter({ ...filter, tags: [] })}>
                                    <Clear />
                                </IconButton>
                            </Box>
                        </Stack>
                        <TagsSelect
                            sx={{ my: 1 }}
                            opType={null}
                            categories={[]}
                            addedTags={[]}
                            selected={filter.tags}
                            onSelectedChange={(selected) => {
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
    )
}
